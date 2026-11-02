// ============================================================
// components/PasswordRules.jsx
// Password rules ticked live while the user types. The API checks
// them again: the browser check is only a help for the user.
// ============================================================

import { PASSWORD_RULES } from '../utils/password';

export default function PasswordRules({ id, value }) {
  return (
    <ul id={id} className="password-rules mt-2 mb-0">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value);
        return (
          <li key={rule.id} className={ok ? 'is-ok' : ''}>
            {rule.label}
            <span className="visually-hidden">{ok ? ' : respecté' : ' : non respecté'}</span>
          </li>
        );
      })}
    </ul>
  );
}
