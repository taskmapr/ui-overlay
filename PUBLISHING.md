# Publishing Guide

## Pre-publish Checklist

Before publishing to npm, ensure:

1. **Version is updated** in `package.json`
2. **Build succeeds**: `npm run build`
3. **Types are generated**: Check `dist/index.d.ts` exists
4. **Test locally**: Use `npm link` or `npm pack` to test
5. **README is up to date**
6. **Repository URL is correct** in `package.json`

## Publishing Steps

### 1. Test the build
```bash
npm run build
```

This will:
- Generate TypeScript declarations in `dist/`
- Build ESM and CJS bundles

### 2. Test locally
```bash
npm pack
```

This creates a `.tgz` file you can install in another project:
```bash
npm install /path/to/taskmapr-ui-overlay-1.0.0.tgz
```

### 3. Login to npm (first time only)
```bash
npm login
```

### 4. Publish to npm
```bash
npm publish --access public
```

For scoped packages (@taskmapr/ui-overlay), you need `--access public` unless you have a paid npm account.

## Version Management

Follow [Semantic Versioning](https://semver.org/):

- **Patch** (1.0.x): Bug fixes, no API changes
  ```bash
  npm version patch
  ```

- **Minor** (1.x.0): New features, backward compatible
  ```bash
  npm version minor
  ```

- **Major** (x.0.0): Breaking changes
  ```bash
  npm version major
  ```

These commands will:
1. Update version in `package.json`
2. Create a git commit
3. Create a git tag

Then:
```bash
git push && git push --tags
npm publish --access public
```

## What Gets Published

The following are included (see `.npmignore` and `files` in `package.json`):
- ✅ `dist/` - Built files
- ✅ `src/` - Source files (for source maps)
- ✅ `README.md`
- ✅ `LICENSE`
- ✅ `package.json`

The following are excluded:
- ❌ `src/demo/` - Demo files
- ❌ `src/main.tsx` - Dev entry point
- ❌ Config files (vite, tailwind, etc.)
- ❌ `.env*` files
- ❌ `node_modules/`

## Troubleshooting

### "Package already exists"
The version already exists on npm. Increment the version:
```bash
npm version patch
npm publish --access public
```

### "You must be logged in"
```bash
npm login
```

### Build fails
Check:
- All dependencies are installed: `npm install`
- TypeScript compiles: `npm run type-check`
- No syntax errors in source files
