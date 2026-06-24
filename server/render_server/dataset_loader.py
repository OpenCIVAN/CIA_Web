"""
dataset_loader.py
Discovers VTK datasets from configured dataset directories.
Returns normalized descriptors for the render server's /datasets endpoint.
"""
import os
import re
import logging
from pathlib import Path

log = logging.getLogger(__name__)

SUPPORTED_EXTENSIONS = {".vtp", ".vtu", ".vti"}


def slugify(name: str) -> str:
    """Convert a filename stem to a URL-safe dataset ID."""
    name = re.sub(r"[^\w\s-]", "", name).strip()
    name = re.sub(r"[\s_-]+", "-", name)
    return name.lower()


def scan_datasets(dataset_dirs: list) -> list:
    """
    Scan directories for VTK dataset files.

    Args:
        dataset_dirs: List of directory paths to scan.

    Returns:
        List of dataset dicts: { id, name, path, type, sizeBytes, sizeMB }
    """
    datasets = []
    seen_ids: set = set()

    for directory in dataset_dirs:
        if not directory or not os.path.isdir(directory):
            if directory:
                log.debug(f"[dataset_loader] Directory not found: {directory}")
            continue

        log.info(f"[dataset_loader] Scanning: {directory}")

        for filename in sorted(os.listdir(directory)):
            filepath = os.path.join(directory, filename)

            if not os.path.isfile(filepath):
                continue

            suffix = Path(filename).suffix.lower()
            if suffix not in SUPPORTED_EXTENSIONS:
                continue

            stem = Path(filename).stem
            dataset_id = slugify(stem)

            # Disambiguate duplicate IDs across directories
            if dataset_id in seen_ids:
                dir_slug = slugify(os.path.basename(directory))
                dataset_id = f"{dataset_id}-{dir_slug}"
            seen_ids.add(dataset_id)

            size_bytes = os.path.getsize(filepath)
            file_type = suffix.lstrip(".")

            entry = {
                "id": dataset_id,
                "name": stem,
                "path": filepath,
                "type": file_type,
                "sizeBytes": size_bytes,
                "sizeMB": round(size_bytes / (1024 * 1024), 1),
            }
            datasets.append(entry)

            log.info(
                f"[dataset_loader] Discovered: {dataset_id} "
                f"({filename}, {entry['sizeMB']} MB, {file_type})"
            )

    log.info(f"[dataset_loader] Total: {len(datasets)} dataset(s) found")
    return datasets
