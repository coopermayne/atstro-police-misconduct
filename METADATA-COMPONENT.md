# MetadataItem Component

Single flexible component for displaying metadata with icons and badges.

## Usage

```astro
import MetadataItem from '../components/MetadataItem.astro';

<!-- Date -->
<MetadataItem type="date" content={incidentDate} size="md" />

<!-- Location -->
<MetadataItem type="location" content="" city="Los Angeles" county="Los Angeles" size="md" />

<!-- Age -->
<MetadataItem type="age" content={28} size="md" />

<!-- Body cam (inline) -->
<MetadataItem type="bodycam" content={true} size="md" variant="inline" />

<!-- Body cam (badge) -->
<MetadataItem type="bodycam" content={true} size="md" variant="badge" />

<!-- Agency badge -->
<MetadataItem type="agency" content="LAPD" size="md" />

<!-- Force type badge -->
<MetadataItem type="forceType" content="Shooting" size="md" />

<!-- Tag badge -->
<MetadataItem type="tag" content="civil-rights" size="md" />
```

## Props

- **type**: `'date' | 'location' | 'age' | 'bodycam' | 'agency' | 'forceType' | 'tag'`
- **content**: `string | number | boolean` - The main content to display
- **variant**: `'inline' | 'badge'` - Display style (defaults to badge for agency/forceType/tag, inline for others)
- **size**: `'sm' | 'md' | 'lg'` - Size variant
- **city**: `string` - For location type only
- **county**: `string` - For location type only

## Layout Examples

### Above Title (Date, Location, Age)
```astro
<div class="flex flex-wrap gap-x-4 gap-y-2 mb-4">
  <MetadataItem type="date" content={incident_date} size="lg" />
  <MetadataItem type="location" content="" city={city} county={county} size="lg" />
  {age && <MetadataItem type="age" content={age} size="lg" />}
</div>
```

### Below Description (Agencies, Force Type, Body Cam)
```astro
<div class="flex flex-wrap gap-2 mb-8">
  {agencies?.map(agency => <MetadataItem type="agency" content={agency} size="md" />)}
  {force_type?.map(force => <MetadataItem type="forceType" content={force} size="md" />)}
  <MetadataItem type="bodycam" content={!!bodycam_available} size="md" variant="badge" />
</div>
```

### Compact Inline (Sidebar)
```astro
<div class="flex flex-wrap gap-x-3 gap-y-1">
  <MetadataItem type="date" content={incident_date} size="sm" />
  <MetadataItem type="location" content="" city={city} county={county} size="sm" />
  {age && <MetadataItem type="age" content={age} size="sm" />}
  <MetadataItem type="bodycam" content={!!bodycam_available} size="sm" variant="inline" />
</div>
```

## Color Schemes

- **date, location, age**: Gray text with gray icons
- **bodycam inline**: Green text
- **bodycam badge**: Green background with border
- **agency**: Gray background with border
- **forceType**: Orange background with border
- **tag**: Gray background with border
