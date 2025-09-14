# Contributing to Allcontext

Thank you for your interest in contributing to Allcontext. This project follows a philosophy of simplicity, minimalism, and effectiveness.

## How to Contribute

### Reporting Issues

- Use [GitHub Issues](https://github.com/yourusername/allcontext/issues)
- Check existing issues first
- Include: clear description, steps to reproduce, expected vs actual behavior
- For bugs: include environment details (OS, Python version, etc.)

### Submitting Pull Requests

1. **Fork and clone the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes** following our philosophy:
   - Simplicity over complexity
   - Clean, readable code
   - Proper type hints
   - No unnecessary dependencies
4. **Test your changes**:
   ```bash
   # Backend tests
   cd backend
   pytest tests/

   # Frontend tests
   cd frontend
   npm test
   ```
5. **Commit with clear message**: `git commit -m "Add feature: description"`
6. **Push and create PR**: Include what and why in description

## Development Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # Add your Supabase credentials
python app/main.py
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Add your Supabase credentials
npm run dev
```

## Code Style

### Philosophy
- **First principles thinking** - Best solutions are simple
- **Minimalism** - Every line should have purpose and clarity
- **Production-ready** - Robust, efficient, scalable
- **No hacks** - Clean foundations for future development

### Python
- Type hints required
- Black formatting
- Clear variable names
- Docstrings for public functions

### TypeScript/React
- Functional components
- TypeScript strict mode
- Meaningful component names
- No unnecessary abstractions

## Testing

- Add tests for new features
- Maintain existing test coverage
- Test both happy path and edge cases
- Integration tests for API changes

## Questions?

Open a [Discussion](https://github.com/yourusername/allcontext/discussions) on GitHub.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
