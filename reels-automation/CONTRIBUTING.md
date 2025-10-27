# Contributing to Instagram Reels Automation

Thank you for considering contributing! This project aims to make automated Reels creation accessible to developers and content creators.

## How to Contribute

### Reporting Bugs

1. Check if the bug is already reported in Issues
2. If not, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - System info (OS, Node version, Python version, OBS version)
   - Screenshots/logs if applicable

### Suggesting Features

1. Check existing feature requests
2. Create new issue with:
   - Clear use case
   - Expected behavior
   - Why it would benefit users

### Code Contributions

#### Setup Development Environment

1. Fork the repository
2. Clone your fork
3. Install dependencies:
   ```bash
   npm install
   pip install -r scripts/requirements.txt
   ```
4. Create feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

#### Development Guidelines

**Code Style**
- JavaScript: Use ES6+ features, async/await for promises
- Python: Follow PEP 8 style guide
- React: Functional components with hooks
- Use meaningful variable/function names
- Comment complex logic

**Testing**
- Test changes locally before submitting PR
- Ensure all scripts work independently
- Test full pipeline end-to-end
- Check on Windows (primary platform)

**Commit Messages**
- Use clear, descriptive messages
- Format: `type: description`
- Types: feat, fix, docs, style, refactor, test, chore

Examples:
```
feat: add support for macOS paths
fix: correct OBS reconnection logic
docs: update Instagram API setup guide
```

#### Areas for Contribution

**High Priority**
- [ ] Cross-platform support (macOS, Linux)
- [ ] Database integration (replace in-memory storage)
- [ ] Scheduling system for auto-posting
- [ ] Better error handling and retry logic
- [ ] Unit tests for core functions

**Features**
- [ ] Support for more code languages (Python, Java, etc.)
- [ ] Custom templates/themes
- [ ] A/B testing for thumbnails
- [ ] Analytics dashboard
- [ ] Batch processing multiple videos

**Documentation**
- [ ] Video tutorials
- [ ] More example snippets
- [ ] Troubleshooting guide expansion
- [ ] Translation to other languages

**Scripts**
- [ ] Alternative to OBS (screen capture alternatives)
- [ ] Support for other platforms (TikTok, YouTube Shorts)
- [ ] Auto-caption generation
- [ ] Voice-over automation

### Pull Request Process

1. Update README.md with any new features/changes
2. Update documentation if needed
3. Ensure code follows style guidelines
4. Test thoroughly on your system
5. Create PR with:
   - Clear description of changes
   - Reference to related issue (if any)
   - Screenshots/demos for UI changes

### Code Review

- Be patient - reviews may take a few days
- Be open to feedback and suggestions
- Make requested changes in new commits
- Once approved, PR will be merged

## Community Guidelines

- Be respectful and constructive
- Help others in issues/discussions
- Share your use cases and results
- Credit others' contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to open a discussion or issue for any questions about contributing!

---

**Thank you for helping make automated Reels creation better! 🙏**
