"""
render_state.py
Per-session render state management.
Each WebSocket connection gets its own VTKRenderer instance and dataset state.
"""
import time
import threading
import logging
from dataclasses import dataclass, field
from typing import Optional, Dict

log = logging.getLogger(__name__)

SESSION_TIMEOUT_SECONDS = 300  # 5 minutes of inactivity → GC


@dataclass
class RenderSession:
    session_id: str
    renderer: object  # VTKRenderer instance
    loaded_dataset_id: Optional[str] = None
    loaded_dataset_path: Optional[str] = None
    last_active: float = field(default_factory=time.time)

    def touch(self):
        self.last_active = time.time()

    def is_expired(self) -> bool:
        return time.time() - self.last_active > SESSION_TIMEOUT_SECONDS


class SessionManager:
    """
    Thread-safe manager for render sessions.
    Creates VTKRenderer per session, enforces max_sessions with LRU eviction.
    Background thread GCs expired sessions every 60 seconds.
    """

    def __init__(self, render_width: int = 1024, render_height: int = 768, max_sessions: int = 10):
        self._sessions: Dict[str, RenderSession] = {}
        self._lock = threading.Lock()
        self._render_width = render_width
        self._render_height = render_height
        self._max_sessions = max_sessions

        gc_thread = threading.Thread(target=self._gc_loop, daemon=True)
        gc_thread.start()
        log.info(
            f"[session_mgr] Initialized: max={max_sessions}, "
            f"size={render_width}x{render_height}, timeout={SESSION_TIMEOUT_SECONDS}s"
        )

    def get_or_create(self, session_id: str) -> RenderSession:
        """Return existing session or create a new one."""
        with self._lock:
            if session_id in self._sessions:
                session = self._sessions[session_id]
                session.touch()
                return session

            # Enforce max sessions with LRU eviction
            if len(self._sessions) >= self._max_sessions:
                oldest_id = min(
                    self._sessions,
                    key=lambda k: self._sessions[k].last_active,
                )
                log.info(f"[session_mgr] Evicting oldest session: {oldest_id}")
                del self._sessions[oldest_id]

            # Import here to avoid circular imports
            from vtk_renderer import VTKRenderer
            log.info(f"[session_mgr] Creating session: {session_id}")
            renderer = VTKRenderer(self._render_width, self._render_height)
            session = RenderSession(session_id=session_id, renderer=renderer)
            self._sessions[session_id] = session
            return session

    def remove(self, session_id: str):
        with self._lock:
            if session_id in self._sessions:
                del self._sessions[session_id]
                log.info(f"[session_mgr] Removed session: {session_id}")

    def _gc_loop(self):
        while True:
            time.sleep(60)
            with self._lock:
                expired = [sid for sid, s in self._sessions.items() if s.is_expired()]
                for sid in expired:
                    del self._sessions[sid]
                    log.info(f"[session_mgr] GC expired session: {sid}")
