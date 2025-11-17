# Metadata Registry System

The metadata registry ensures consistency across all cases and blog posts by providing canonical names for agencies, counties, force types, tags, and other metadata fields.

## How It Works

When you publish a draft, the AI:
1. **References the canonical registry** to match metadata to existing entries
2. **Normalizes variations** (e.g., "LAPD" → "Los Angeles Police Department")
3. **Prevents duplicates** (e.g., "gunshot" and "gunfire" both map to "Firearm")
4. **Maintains consistency** across all published content

## Registry Contents

The registry (`metadata-registry.json`) contains:

### For Cases:
- **Agencies**: Police departments with aliases (LAPD, Los Angeles PD → Los Angeles Police Department)
- **Counties**: California counties with common variations
- **Force Types**: Standardized force categories (Firearm, Taser, Physical Force, etc.)
- **Threat Levels**: Standardized threat assessments (No Threat, Low Threat, Moderate Threat, High Threat)
- **Investigation Statuses**: Case status options (Under Investigation, Convicted, Civil Settlement, etc.)
- **Case Tags**: Topical tags for categorizing cases

### For Blog Posts:
- **Post Tags**: Educational/legal topic tags

## CLI Tool

Manage the registry using `metadata-registry-cli.js`:

### View Statistics
```bash
node scripts/metadata-registry-cli.js stats
```

### List Entries
```bash
# List all agencies
node scripts/metadata-registry-cli.js list agencies

# List all counties
node scripts/metadata-registry-cli.js list counties

# List force types
node scripts/metadata-registry-cli.js list force-types

# List threat levels
node scripts/metadata-registry-cli.js list threat-levels

# List investigation statuses
node scripts/metadata-registry-cli.js list investigation-statuses

# List case tags
node scripts/metadata-registry-cli.js list case-tags

# List blog post tags
node scripts/metadata-registry-cli.js list post-tags
```

### Add New Entries

#### Add an Agency
```bash
node scripts/metadata-registry-cli.js add-agency "Berkeley Police Department" "BPD,Berkeley PD" "Alameda" "Berkeley"
```

#### Add a Tag
```bash
# Add case tag
node scripts/metadata-registry-cli.js add-tag "Wrongful Arrest" case

# Add blog post tag
node scripts/metadata-registry-cli.js add-tag "Expert Witnesses" post
```

### View AI Format
See how the registry appears to the AI during publishing:
```bash
node scripts/metadata-registry-cli.js show-ai-format case
node scripts/metadata-registry-cli.js show-ai-format post
```

## Examples

### Before Registry (Inconsistent)
- Agency: "LAPD", "Los Angeles PD", "LA Police Department", "Los Angeles Police"
- Force: "gunshot", "gunfire", "shot", "shooting"
- Status: "settled", "settlement", "civil settlement reached"

### After Registry (Consistent)
- Agency: "Los Angeles Police Department" (all variants normalized)
- Force: "Firearm" (all gun-related terms normalized)
- Status: "Civil Settlement" (all settlement variants normalized)

## Automatic Integration

The registry is **automatically used** during publishing:

1. **Draft Validation** - AI receives registry context
2. **Metadata Extraction** - AI matches draft content to canonical names
3. **Normalization** - System double-checks and normalizes extracted metadata
4. **Publication** - Only canonical names appear in published content

## Adding New Entries

### When to Add
- **New agencies** when covering cases from new jurisdictions
- **New tags** when covering new topics not in existing list
- **Never needed for**: Force types, threat levels, or investigation statuses (these are complete)

### How AI Handles New Content
If the draft mentions an agency not in the registry, the AI will:
1. Use the name as written in the draft
2. Log it for manual review
3. You can then add it to the registry with proper aliases

## Benefits

✅ **Consistency**: All metadata uses canonical names
✅ **Searchability**: Users can find all LAPD cases, not miss some labeled "LA Police"  
✅ **Analytics**: Accurate aggregation by agency, force type, etc.
✅ **Professional**: Site appears well-organized and authoritative
✅ **Maintainable**: Easy to update canonical names in one place

## File Locations

- **Registry**: `/data/metadata-registry.json`
- **CLI Tool**: `/scripts/metadata-registry-cli.js`
- **Module**: `/scripts/registry/metadata-registry.js`
- **Integration**: `/scripts/publish-draft.js` (automatic)
