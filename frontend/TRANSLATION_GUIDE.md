# Translation Implementation Guide

## Pattern for Applying t() to All Pages

For each page, wrap all English text strings with the `t()` function. Here's the systematic approach:

### 1. Static Arrays/Objects
```javascript
// BEFORE:
const items = [
  { title: "Item 1", description: "Description 1" },
  { title: "Item 2", description: "Description 2" }
];

// AFTER: Translate in rendering
{items.map(item => (
  <div>
    <h3>{t(item.title)}</h3>
    <p>{t(item.description)}</p>
  </div>
))}
```

### 2. JSX Text Content
```javascript
// BEFORE:
<button>Click Here</button>
<h1>Page Title</h1>
<p>Some description text</p>

// AFTER:
<button>{t("Click Here")}</button>
<h1>{t("Page Title")}</h1>
<p>{t("Some description text")}</p>
```

### 3. Attributes
```javascript
// BEFORE:
<input placeholder="Enter your name" />
<button aria-label="Close modal" title="Close this window">

// AFTER:
<input placeholder={t("Enter your name")} />
<button aria-label={t("Close modal")} title={t("Close this window")}>
```

### 4. Conditional Text
```javascript
// BEFORE:
{isLoading ? "Loading..." : "Load More"}

// AFTER:
{isLoading ? t("Loading...") : t("Load More")}
```

### 5. Template Strings with Variables
```javascript
// BEFORE:
`Welcome, ${userName}!`
`You have ${count} items`

// AFTER:
t(`Welcome, ${userName}!`)
t(`You have ${count} items`)
```

## Pages Requiring Translation

###  Completed (petCare.jsx)
- ✅ Main titles and subtitles
- ✅ Button labels
- ✅ Essentials section
- ✅ Toxic items section
- ✅ Error messages
- ✅ Aria labels

### 🔄 In Progress / Remaining Pages:

#### 1. dashboard.jsx
- Feature cards text
- Welcome messages
- Button labels ("Emergency", etc.)
- Cat fact text
- Footer content

#### 2. LandingPage.jsx
- Hero section headings
- Call-to-action buttons
- Feature descriptions
- Stats labels ("active caretakers", "monitoring ready")
- Disease cards names
- How it works section

#### 3. AssistantChat.jsx
- Chat UI text ("Chats", "New", "No chats yet")
- Input placeholders
- Button labels ("পাঠান", "ছবি সংযুক্তি")
- Status messages

#### 4. profilePage.jsx
- Form labels
- Input placeholders
- Section headings
- Validation messages
- Success/error messages

#### 5. vaccineAlert.jsx
- Section titles
- Form labels
- Button text
- Table headers
- Status messages

#### 6. PetProfile.jsx
- Tab names
- Form fields
- Data display labels
- Action buttons

#### 7. SkinDiseaseDetection.jsx
- Instructions
- Button labels
- Result display text
- Error messages

#### 8. vetFinder.jsx
- Search labels
- Filter options
- Vet card information
- Distance indicators

#### 9. AddPetPage.jsx
- Form labels
- Input placeholders
- Validation messages
- Submit button

#### 10. About.jsx
- Team member descriptions
- University names
- Roles and titles

### Quick Action Commands:

For each page, follow these steps:
1. Import useLanguage if not already imported
2. Destructure `t` from `useLanguage()`
3. Find all hardcoded English strings
4. Wrap them with `t()`
5. Test the page with language toggle

### Example Template for Any Page:

```javascript
import { useLanguage } from '../context/LanguageContext';

function MyPage() {
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t("Page Title")}</h1>
      <p>{t("Description text")}</p>
      <button>{t("Action Button")}</button>
    </div>
  );
}
```

## Priority Order for Translation:

1. **High Priority** (User-facing content):
   - LandingPage.jsx
   - dashboard.jsx
   - profilePage.jsx
   - PetProfile.jsx

2. **Medium Priority** (Frequently used):
   - AssistantChat.jsx
   - vaccineAlert.jsx
   - vetFinder.jsx
   - SkinDiseaseDetection.jsx

3. **Lower Priority** (Less frequent):
   - AddPetPage.jsx
   - About.jsx
   - SignUp.jsx
   - LoginPage.jsx

## Notes:
- Don't translate:
  - Technical terms that should remain in English
  - API endpoints
  - CSS class names
  - Variable names
  - URLs
  - Email addresses
  - Phone numbers

- Do translate:
  - User interface text
  - Messages and notifications
  - Form labels and placeholders
  - Button text
  - Headings and descriptions
  - Help text and tooltips
