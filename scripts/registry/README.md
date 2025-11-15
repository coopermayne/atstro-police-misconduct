# Metadata Registry

This folder contains tools for managing canonical metadata values used across the site.

## Files

- **`metadata-registry.js`** - Core module for loading, saving, and matching metadata
- **`metadata-registry-cli.js`** - Command-line interface for managing registry entries
- **`rebuild-registry.js`** - Rebuilds entire registry from all published content
- **`sync-registry.js`** - Auto-syncs registry (called during `npm run dev` and `npm run build`)
- **`update-registry-from-content.js`** - Updates registry from a single content file
- **`normalize-metadata.js`** - Normalizes existing content against registry values

## Purpose

The metadata registry ensures consistent terminology across all cases and posts:

- **Agencies**: Police departments (e.g., "Berkeley Police Department")
- **Counties**: California counties (e.g., "Alameda County")
- **Case Tags**: Topics for case articles (e.g., "Excessive Force", "Unlawful Arrest")
- **Post Tags**: Topics for blog posts (e.g., "Legal Analysis", "Police Reform")

Fixed values are also maintained:
- Force types (Physical Force, Weapon Use, etc.)
- Threat levels (No Threat, Non-Violent, etc.)
- Investigation statuses (Under Investigation, Charges Filed, etc.)

## Auto-Sync

The registry is **automatically rebuilt** when you run:

```bash
npm run dev
npm run build
```

This ensures the registry always reflects current published content.

## Manual Usage

```bash
# Rebuild registry from all content
node scripts/registry/rebuild-registry.js

# Add entries manually
node scripts/registry/metadata-registry-cli.js add-agency "Berkeley PD"
node scripts/registry/metadata-registry-cli.js add-tag "Excessive Force" case

# List all entries
node scripts/registry/metadata-registry-cli.js list agencies
node scripts/registry/metadata-registry-cli.js list counties
node scripts/registry/metadata-registry-cli.js list case-tags

# View statistics
node scripts/registry/metadata-registry-cli.js stats
```

## Data Storage

Registry data is stored in `/metadata-registry.json` at the project root.

See [METADATA-REGISTRY.md](../../METADATA-REGISTRY.md) for complete documentation.
