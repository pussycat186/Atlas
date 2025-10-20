# Atlas UI - Accessibility Checklist

## Mục tiêu tuân thủ
- **WCAG 2.1 Level AA** (Web Content Accessibility Guidelines)
- Hỗ trợ screen readers
- Keyboard navigation
- Touch target tối thiểu 44x44px
- Contrast ratio ≥ 4.5:1 cho văn bản thông thường

## Color Contrast

- [ ] Text trên nền primary (#0A2540): Contrast ratio ≥ 4.5:1
- [ ] Text trên nền secondary (#00D4AA): Contrast ratio ≥ 4.5:1
- [ ] Link colors có contrast đủ
- [ ] Disabled states vẫn có contrast ≥ 3:1
- [ ] Focus indicators rõ ràng (outline hoặc border)

## Keyboard Navigation

- [ ] Tất cả interactive elements có thể tab được (tabindex phù hợp)
- [ ] Focus order logic và theo thứ tự visual
- [ ] Enter/Space kích hoạt buttons và links
- [ ] Escape đóng modals/dialogs
- [ ] Arrow keys navigate trong lists/menus
- [ ] Skip to main content link (optional but recommended)

## Touch Targets

- [ ] Buttons tối thiểu 44x44px
- [ ] Links và interactive elements tối thiểu 44x44px
- [ ] Spacing giữa touch targets ≥ 8px
- [ ] Lock badge trong ChatView: 28x28px → cần tăng lên 44x44px hoặc padding

## Screen Reader Support

- [ ] Semantic HTML (header, nav, main, footer, article, section)
- [ ] ARIA labels cho icons và non-text elements
  - `aria-label` cho buttons chỉ có icon
  - `aria-labelledby` và `aria-describedby` khi cần
- [ ] Live regions cho dynamic content (aria-live, aria-atomic)
- [ ] Form labels rõ ràng (label với for attribute)
- [ ] Error messages kết nối với inputs (aria-describedby)
- [ ] Loading states có aria-busy="true"

## Forms & Inputs

- [ ] Label rõ ràng cho mọi input
- [ ] Placeholder không thay thế label
- [ ] Error messages mô tả rõ ràng
- [ ] Required fields có indicator (asterisk + aria-required)
- [ ] Autocomplete attributes phù hợp
- [ ] Input types đúng (email, tel, url, etc.)

## Images & Media

- [ ] Alt text mô tả cho images
- [ ] Decorative images có alt="" (empty string)
- [ ] SVG có role="img" và title/desc tags
- [ ] Video có captions/subtitles
- [ ] Audio có transcripts

## Responsive & Mobile

- [ ] Viewport meta tag đúng
- [ ] Text có thể resize lên 200% không bị cắt
- [ ] Scroll horizontal không bắt buộc (trừ tables/code)
- [ ] Portrait và landscape đều hoạt động
- [ ] Touch gestures có alternatives (không chỉ dựa vào swipe)

## Components Checklist

### OnboardingPasskey
- [ ] Input có label rõ ràng
- [ ] Button states có aria attributes
- [ ] Loading spinner có aria-live announcement
- [ ] Success message có role="status"

### ChatView
- [ ] Messages list có semantic structure
- [ ] Lock badge có aria-label="Xác thực receipt"
- [ ] Input có label (có thể visually hidden)
- [ ] Send button có aria-label
- [ ] Timestamp có semantic time element
- [ ] New message announcement với aria-live

### VerifyPortal
- [ ] Form inputs có labels
- [ ] Filter controls accessible
- [ ] Results list có semantic structure
- [ ] Status icons có text alternatives
- [ ] Empty state có meaningful text

### SettingsPanel
- [ ] Toggles có role="switch" và aria-checked
- [ ] Range slider có aria-valuemin/max/now
- [ ] Radio groups có proper role và aria-checked
- [ ] Save confirmation có role="alert"

## Testing Tools

1. **Automated**:
   - axe DevTools
   - Lighthouse Accessibility audit
   - WAVE browser extension
   - Pa11y CI

2. **Manual**:
   - Keyboard only navigation
   - Screen reader testing (NVDA, JAWS, VoiceOver)
   - Zoom to 200%
   - High contrast mode
   - Color blindness simulator

3. **Real Users**:
   - Beta testing với người dùng khuyết tật
   - Feedback và iterate

## Priority Fixes

### High Priority (Blocking)
- Color contrast violations
- Missing alt text
- Keyboard traps
- Missing form labels

### Medium Priority
- Suboptimal focus indicators
- Missing ARIA labels
- Small touch targets
- Confusing focus order

### Low Priority (Enhancement)
- Skip links
- Keyboard shortcuts
- Enhanced screen reader announcements
- Reduced motion preferences

## Resources

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Inclusive Components](https://inclusive-components.design/)

---

**Ngày tạo**: 2025-10-21  
**Phiên bản**: 1.0  
**Trạng thái**: Draft - cần implement và test
