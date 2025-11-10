import { useEffect, useState } from 'react';

import { useHighlightable } from '../../hooks/useHighlightable';
import { DemoTeamMember, fetchDemoTeam } from '../mockBackend';

const TeamTableRow = ({ member }: { member: DemoTeamMember }) => {
  const highlightRef = useHighlightable<HTMLTableRowElement>({
    name: `${member.name} profile`,
    description: `${member.role} focusing on ${member.focus}`,
    keywords: [member.role, member.focus],
  });

  return (
    <tr ref={highlightRef} id={`team-member-${member.id}`}>
      <th scope="row">{member.name}</th>
      <td>{member.role}</td>
      <td>{member.focus}</td>
      <td>
        <a href={`mailto:${member.email}`} className="demo-link">
          {member.email}
        </a>
      </td>
    </tr>
  );
};

export const TeamPage = () => {
  const [team, setTeam] = useState<DemoTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDemoTeam().then((teamData) => {
      if (!mounted) return;
      setTeam(teamData);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const highlightRef = useHighlightable<HTMLDivElement>({
    name: 'Team directory',
    description: 'Contact details for team members partnering on this workspace.',
    keywords: ['team', 'directory'],
  });

  return (
    <div className="demo-page" aria-labelledby="team-heading">
      <div className="demo-page__heading">
        <h1 id="team-heading">Team directory</h1>
        <p className="demo-muted">
          Quickly find who owns what workstream. TaskMapr can highlight people relevant to a prompt.
        </p>
      </div>

      <section ref={highlightRef} className="demo-card demo-team-card">
        <header className="demo-section__header">
          <h2>Team members</h2>
          <span className="demo-badge">{loading ? 'Loading…' : `${team.length} people`}</span>
        </header>

        {loading ? (
          <p className="demo-empty">Loading the directory…</p>
        ) : (
          <div className="demo-table-wrapper" id="team-table">
            <table className="demo-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Role</th>
                  <th scope="col">Focus</th>
                  <th scope="col">Contact</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <TeamTableRow key={member.id} member={member} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

