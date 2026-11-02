// ============================================================
// components/SkipLink.jsx
// First link of every page, visible only with the keyboard:
// jumps over the header and the menu, straight to the content.
// ============================================================

export default function SkipLink() {
  const handleClick = (event) => {
    event.preventDefault(); // keep the URL clean (no #contenu)
    document.getElementById('contenu')?.focus();
  };

  return (
    <a href="#contenu" className="skip-link" onClick={handleClick}>
      Aller au contenu
    </a>
  );
}
