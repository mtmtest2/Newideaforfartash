// "My account" for panels that have no profile page of their own (reception): password change on the real account.
import { ChangePassword } from './parts'

export default function Account() {
  return <div className="p-page"><ChangePassword aud="staff" role="reception" /></div>
}
