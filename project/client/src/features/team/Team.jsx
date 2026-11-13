import { ShieldCheck } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge.jsx'

function Team({ members }) {
  return (
    <div className="page-stack">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Access control</p>
          <h1>Team</h1>
          <p className="page-heading__description">People and roles in the Stockroom workspace</p>
        </div>
      </section>
      <section className="team-summary">
        <article className="panel team-summary__card">
          <span className="team-summary__icon"><ShieldCheck aria-hidden="true" size={18} /></span>
          <div><strong>Role-based access</strong><p>Permissions are managed by workspace role</p></div>
        </article>
        <p className="team-summary__note">Role changes require an administrator</p>
      </section>
      <section className="panel">
        <div className="panel-heading panel-heading--inset">
          <div><h2>Workspace members</h2><p>{members.length} people</p></div>
        </div>
        <div className="table-scroll">
          <table className="data-table team-table">
            <thead><tr><th>Member</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.email}>
                  <td>
                    <span className="member-cell">
                      <span aria-hidden="true" className="member-avatar">{member.initials}</span>
                      <span className="member-cell__copy"><strong>{member.name}</strong><span>{member.email}</span></span>
                    </span>
                  </td>
                  <td>{member.roleLabel}</td>
                  <td><StatusBadge tone={member.status === 'Active' ? 'positive' : 'neutral'}>{member.status}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Team
