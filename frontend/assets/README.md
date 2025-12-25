# /assets/ - Static Assets

**Purpose**: Images, icons, and static files

**Structure**:
```
assets/
├── images/                    # App images, logos
│   ├── logo.png
│   ├── splash.png
│   └── placeholder-avatar.png
└── icons/                     # Custom icons
    ├── calendar-icon.png
    ├── feed-icon.png
    ├── profile-icon.png
    └── qr-icon.png
```

**Asset Guidelines**:

## Images
- Use PNG for logos and graphics with transparency
- Use JPEG for photos
- Optimize file sizes for mobile
- Include @2x and @3x versions for different screen densities

## Icons
- Prefer vector icons from `@expo/vector-icons` when possible
- Custom icons should be SVG or high-res PNG
- Keep icon sizes consistent (e.g., 24x24, 48x48)
- Use meaningful filenames

**Usage in Code**:
```typescript
import { Image } from 'react-native'

<Image
  source={require('@/assets/images/logo.png')}
  style={{ width: 100, height: 100 }}
/>
```

**Expo Asset Loading**:
- Assets are automatically bundled by Expo
- Use `require()` for static assets
- For remote images, use `<Image source={{ uri: 'https://...' }} />`

**Best Practices**:
- Keep assets organized by type
- Use descriptive filenames
- Compress images before committing
- Don't commit large files (>1MB) - use remote storage instead
