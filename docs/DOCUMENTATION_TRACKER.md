# CIA Web: Documentation Status Tracker

This document tracks the status of all guides and what needs updating as the architecture evolves.

---

## 📚 Guide Status

### ✅ Contributor Guide (Comprehensive)
**File:** `docs/guides/CONTRIBUTOR_GUIDE.md`  
**Status:** Complete for current architecture  
**Last Updated:** November 2025

**Needs updating when:**
- [ ] yInstances → yViews refactor complete
- [ ] Server-generated view IDs implemented
- [ ] Backend authentication added
- [ ] Recording system implemented

### ✅ Developer Quick Reference
**File:** `docs/guides/QUICK_REFERENCE.md`  
**Status:** Complete for current architecture  
**Last Updated:** November 2025

**Needs updating when:**
- [ ] New manager APIs added
- [ ] New SASS tokens defined
- [ ] New debugging commands added

### ✅ VR Implementation Guide
**File:** `docs/guides/VR_IMPLEMENTATION.md`  
**Status:** Foundational (not yet implemented)  
**Last Updated:** November 2025

**Needs updating when:**
- [ ] VR actually implemented (will need code review)
- [ ] Collaborative VR features added
- [ ] VR recording implemented
- [ ] Testing results documented

**Known gaps:**
- Integration with server-generated view IDs
- Collaborative cursors in VR
- Recording VR sessions
- Performance optimization specifics

### ⚠️ Backend Setup Guide
**File:** `docs/guides/BACKEND_SETUP.md`  
**Status:** Basic setup only - missing advanced features  
**Last Updated:** November 2025

**Needs updating when:**
- [x] Basic PostgreSQL setup (Done)
- [x] Basic API server (Done)
- [x] Dataset upload/download (Done)
- [ ] Multi-tenant projects table added
- [ ] User authentication implemented
- [ ] Y.js persistence to database
- [ ] MinIO/S3 storage implemented
- [ ] Session recording tables added
- [ ] View configurations table updated
- [ ] WorkspaceLayouts table added
- [ ] LinkConfiguration system added

**Current database schema has:**
```
✅ sessions
✅ datasets  
✅ annotations
✅ view_configurations (basic)
✅ analysis_jobs
```

**Missing from schema:**
```
❌ users (authentication)
❌ projects (multi-tenant)
❌ project_members (permissions)
❌ session_recordings
❌ workspace_layouts
❌ link_configurations
❌ y_docs (Y.js persistence)
```

---

## 🚧 In-Progress Architecture Changes

Track what's changing and when guides need updates.

### Sprint 1: Database Migration & MinIO (In Progress)
**Status:** Active development  
**Affects:**
- Backend Setup Guide (major update needed)
- API Reference (new endpoints)

**Changes:**
- Adding MinIO for file storage
- Implementing S3 service abstraction
- Database schema expansion

**Action Items:**
- [ ] Update Backend Guide with MinIO setup
- [ ] Document S3 service interface
- [ ] Update file upload examples

### Sprint 2: Projects & Multi-Tenancy (Planned)
**Status:** Not started  
**Affects:**
- Backend Setup Guide (authentication section)
- Contributor Guide (project scope explanation)
- Quick Reference (new manager methods)

**Changes:**
- User authentication with JWT
- Project CRUD operations
- Role-based permissions

**Action Items:**
- [ ] Add authentication guide section
- [ ] Document project API endpoints
- [ ] Update React integration examples

### Sprint 3: Y.js Persistence (Planned)
**Status:** Not started  
**Affects:**
- Backend Setup Guide (Y.js storage)
- Architecture docs (persistence layer)

**Changes:**
- Store Y.js updates in PostgreSQL
- Load persisted state on connect
- Implement snapshot/restore

**Action Items:**
- [ ] Document Y.js persistence tables
- [ ] Explain CRDT storage strategy
- [ ] Update collaboration examples

### Sprint 4: ViewConfigurations Refactor (Planned)
**Status:** Design phase  
**Affects:**
- Contributor Guide (three-layer model)
- Quick Reference (manager APIs)
- Backend Guide (view endpoints)

**Changes:**
- yInstances → yViews rename
- Server-generated view IDs
- Enhanced view collaboration

**Action Items:**
- [ ] Update three-layer model explanation
- [ ] Document view ID generation flow
- [ ] Update code examples throughout

### Sprint 5: Recording System (Planned)
**Status:** Not started  
**Affects:**
- Backend Guide (recording tables)
- API Reference (recording endpoints)
- Contributor Guide (recording concepts)

**Changes:**
- Record Y.js events
- Playback system
- Recording metadata

**Action Items:**
- [ ] Document recording architecture
- [ ] Add recording API examples
- [ ] Explain playback mechanism

### Sprint 6: Voice Integration (Planned)
**Status:** Partially implemented (basic LiveKit)  
**Affects:**
- Backend Guide (LiveKit production setup)
- Contributor Guide (voice features)

**Changes:**
- Breakout rooms
- Spatial audio in VR
- Recording voice tracks

**Action Items:**
- [ ] Update LiveKit configuration
- [ ] Document breakout room API
- [ ] Add spatial audio examples

---

## 📋 Update Checklist Template

When implementing a major feature, use this checklist:

```markdown
## [Feature Name] - Documentation Update

**Date:** YYYY-MM-DD
**Sprint:** #
**Implemented by:** @username

### Code Changes
- [ ] Feature implemented and merged
- [ ] Tests passing
- [ ] Code reviewed

### Documentation Updates Needed

#### Contributor Guide
- [ ] Update relevant section: [Section name]
- [ ] Add new examples
- [ ] Update diagrams if needed

#### Backend Guide  
- [ ] Update database schema section
- [ ] Add new API endpoints
- [ ] Update setup instructions

#### Quick Reference
- [ ] Add new manager methods
- [ ] Update import aliases
- [ ] Add debugging commands

#### API Reference
- [ ] Document new endpoints
- [ ] Add request/response examples
- [ ] Update error codes

### Verification
- [ ] Tested examples work
- [ ] No broken links
- [ ] Terminology consistent
- [ ] Claude can find and update docs
```

---

## 🔄 Update Process

### For Beth (or contributors)

**After implementing a feature:**
1. Check this tracker for affected docs
2. Start new Claude chat: "I implemented [feature], need to update docs"
3. Reference this tracker so Claude knows what changed
4. Review and commit updated docs

### For Claude

**When asked to update docs:**
1. Search project knowledge for current doc versions
2. Search codebase for actual implementation
3. Identify gaps between docs and code
4. Update affected sections
5. Return updated artifacts
6. Update this tracker

---

## 📖 Documentation Principles

### Keep These Consistent

1. **Three-Layer Model** always presented as:
   ```
   Dataset (truth) → ViewConfiguration (saved state) → InstanceWindow (ephemeral)
   ```

2. **Plugin Architecture** always explained as:
   ```
   Core asks "WHAT" → Handler decides "HOW"
   ```

3. **Analogies to maintain:**
   - Restaurant (frontend/backend/database)
   - Google Docs for 3D data (collaboration)
   - Browser tabs (instance windows)
   - Bookmarks (view configurations)

4. **Code style:**
   - Always heavily commented
   - Include "Why" not just "How"
   - Show both good and bad examples
   - Provide debugging tips

---

## 🎯 Future Documentation Needs

### New Guides to Create

- [ ] **Authentication Guide** - JWT, bcrypt, protected routes
- [ ] **Testing Guide** - Unit tests, integration tests, E2E
- [ ] **Deployment Guide** - AWS, DigitalOcean, Docker Swarm
- [ ] **API Reference** - Auto-generated from code
- [ ] **Debugging Guide** - Common issues and solutions
- [ ] **Performance Guide** - Optimization techniques
- [ ] **Security Guide** - Best practices, audit checklist
- [ ] **Recording System Guide** - Record and playback
- [ ] **MinIO/S3 Guide** - Cloud storage setup

### Sections to Expand

- [ ] Advanced VTK widgets tutorial
- [ ] Custom plugin development walkthrough
- [ ] WebSocket vs Y.js comparison
- [ ] Database migration strategies
- [ ] Backup and recovery procedures
- [ ] Load testing and scaling
- [ ] CI/CD pipeline setup

---

## 📅 Review Schedule

**Monthly:**
- Check if code changes made docs outdated
- Update status tracker
- Plan documentation sprints

**Per Feature:**
- Update relevant guides immediately after merge
- Test all code examples
- Cross-reference with other docs

**Quarterly:**
- Full documentation review
- Identify gaps
- Plan major rewrites if needed

---

## 🤝 Contributing to Documentation

### For New Contributors

1. Read guides in this order:
   - Contributor Guide (concepts)
   - Quick Reference (patterns)
   - Specific guides (deep dives)

2. When confused by docs:
   - Open issue describing confusion
   - Suggest improvement
   - Update doc after learning

### For Core Team

1. Update docs with code changes
2. Review doc PRs carefully
3. Keep tracker current
4. Schedule documentation work

---

## 📊 Documentation Health Metrics

Track these to know when docs need attention:

- **Coverage:** What % of features are documented?
- **Freshness:** How old are examples compared to code?
- **Accuracy:** Do examples still work?
- **Completeness:** Are all edge cases covered?
- **Accessibility:** Can beginners understand it?

**Current Status:**
```
Coverage:     70% (foundation covered, advanced features pending)
Freshness:    100% (just created, all examples current)
Accuracy:     100% (basic examples tested)
Completeness: 60% (missing advanced features)
Accessibility: 90% (written for beginners)
```

---

## 💡 Tips for Maintaining Docs

### Do's ✅
- Write for your past self (what would have helped?)
- Include real code that runs
- Explain the "why" behind decisions
- Use concrete examples
- Keep language simple
- Add diagrams where helpful

### Don'ts ❌
- Don't copy/paste code without testing
- Don't assume prior knowledge
- Don't use jargon without explaining
- Don't let docs drift from code
- Don't skip error cases
- Don't forget to update tracker

---

## 🔗 Related Files

- `ARCHITECTURE.md` - High-level architecture
- `MIGRATION_PATTERNS.md` - Code migration guide
- `README.md` - Project overview
- `CONTRIBUTING.md` - How to contribute
- `.github/ISSUE_TEMPLATE/` - Issue templates

---

Last Updated: November 2025  
Maintained by: Beth & Claude  
Next Review: December 2025