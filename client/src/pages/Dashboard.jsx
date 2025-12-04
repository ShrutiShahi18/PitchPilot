import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, uploadResume, getResume, deleteResume } from '../api';

const SAMPLE_JD = `We're hiring a Senior Software Engineer to build scalable backend systems for our fintech platform. You'll work with Python, AWS, and microservices architecture. Requirements: 5+ years experience, strong problem-solving skills, and experience with distributed systems.`;

const SAMPLE_PITCH = `I'm a full-stack engineer with 6 years building scalable web applications. Recently led a team that reduced API latency by 40% using Python and AWS. I'm passionate about fintech and would love to contribute to your platform.`;

const initialLead = {
  name: 'Sarah Chen',
  email: 'sarah.chen@techcompany.com',
  role: 'Senior Technical Recruiter',
  company: 'TechCompany Inc',
  linkedinUrl: 'https://www.linkedin.com/in/sarah-chen-recruiter'
};

function StatCard({ label, value, meta }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <div className="stat-value">{value}</div>
      <span className="stat-meta">{meta}</span>
    </div>
  );
}

function LeadRow({ lead }) {
  return (
    <div className="lead-row">
      <div>
        <p className="lead-name">{lead.name}</p>
        <p className="lead-sub">
          {lead.role} · {lead.company}
        </p>
      </div>
      <span className={`lead-status lead-status-${lead.status}`}>
        {lead.status}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [jobDescription, setJobDescription] = useState(SAMPLE_JD);
  const [productPitch, setProductPitch] = useState(SAMPLE_PITCH);
  const [tone, setTone] = useState('friendly');
  const [ownerEmail, setOwnerEmail] = useState('founder@pitchpilot.ai');
  const [leadForm, setLeadForm] = useState(initialLead);
  const [leads, setLeads] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('new');
  const [aiDraft, setAiDraft] = useState({ subject: '', body: '' });
  const [linkedinNote, setLinkedinNote] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState('');
  const [sendStatus, setSendStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [user, setUser] = useState(null);
  const [resume, setResume] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [resumeStatus, setResumeStatus] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      setOwnerEmail(JSON.parse(userData).email);
    }
    refreshLeads();
    refreshCampaigns();
    loadResume();
    
    // Auto-refresh leads every 30 seconds to catch new replies
    const interval = setInterval(() => {
      refreshLeads();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  async function loadResume() {
    try {
      const data = await getResume();
      setResume(data.resume);
    } catch (error) {
      // Resume not uploaded yet, that's okay
      setResume(null);
    }
  }

  async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      setResumeStatus('Only PDF, DOC, and DOCX files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setResumeStatus('File size must be less than 5MB');
      return;
    }

    setUploadingResume(true);
    setResumeStatus('Uploading resume...');

    try {
      const result = await uploadResume(file);
      setResume(result.resume);
      setResumeStatus('Resume uploaded successfully! It will be attached to all emails.');
    } catch (error) {
      setResumeStatus(error.message || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
      // Clear file input
      e.target.value = '';
    }
  }

  async function handleDeleteResume() {
    if (!window.confirm('Are you sure you want to delete your resume? It will no longer be attached to emails.')) {
      return;
    }

    try {
      await deleteResume();
      setResume(null);
      setResumeStatus('Resume deleted successfully');
    } catch (error) {
      setResumeStatus(error.message || 'Failed to delete resume');
    }
  }

  const stats = useMemo(() => {
    const replied = leads.filter((lead) => lead.status === 'replied').length;
    const contacted = leads.filter((lead) => lead.status === 'contacted').length;
    return [
      { label: 'Recruiters contacted', value: leads.length || 0, meta: 'Active outreach' },
      { label: 'Replies', value: replied, meta: 'Goal: 25% reply rate' },
      { label: 'Follow-ups due', value: contacted, meta: 'Auto sequences running' }
    ];
  }, [leads]);

  async function refreshLeads() {
    try {
      const data = await api.listLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to load leads', error);
    }
  }

  async function refreshCampaigns() {
    try {
      const data = await api.listCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns', error);
    }
  }

  function handleLeadChange(field, value) {
    setLeadForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateStatus('Generating personalized email with AI...');
    try {
      const payload = {
        lead: {
          ...leadForm,
          jdSnapshot: jobDescription
        },
        campaignId: selectedCampaign !== 'new' ? selectedCampaign : undefined,
        jobDescriptionOverride: jobDescription,
        productPitch,
        tone
      };

      const draft = await api.generateEmail(payload);
      setAiDraft({ subject: draft.subject, body: draft.body });
      setLinkedinNote(draft.linkedinInsights || '');
      setGenerateStatus(
        draft.provider === 'fallback'
          ? 'AI provider unavailable, used premium template.'
          : 'Draft ready — tweak or send.'
      );
    } catch (error) {
      setGenerateStatus(error.message || 'Failed to generate email');
    } finally {
      setIsGenerating(false);
    }
  }

  async function ensureLeadRecord() {
    try {
      const lead = await api.createLead({
        ...leadForm,
        jdSnapshot: jobDescription,
        personalizationNotes: linkedinNote
      });
      refreshLeads();
      return lead;
    } catch (error) {
      // If 409 or duplicate error, try to find existing lead
      if (error.status === 409 || error?.body?.message?.includes('duplicate') || error?.body?.message?.includes('already exists')) {
        try {
          const existing = await api.findLeadByEmail(leadForm.email);
          if (existing) {
            refreshLeads();
            return existing;
          }
        } catch (findError) {
          // If find also fails, continue with original error
        }
      }
      throw error;
    }
  }

  async function ensureCampaignRecord() {
    if (selectedCampaign && selectedCampaign !== 'new') {
      return campaigns.find((c) => c._id === selectedCampaign);
    }

    const payload = {
      title: `Recruiter Outreach · ${leadForm.company || 'Campaign'}`,
      jobDescription,
      productPitch,
      tone,
      targetRole: leadForm.role || 'Recruiter',
      ownerEmail
    };

    const campaign = await api.createCampaign(payload);
    await refreshCampaigns();
    setSelectedCampaign(campaign._id);
    return campaign;
  }

  async function handleSend() {
    if (!aiDraft.subject || !aiDraft.body) {
      setSendStatus('Generate an email first.');
      return;
    }
    setIsSending(true);
    setSendStatus('Sending via Gmail...');

    try {
      const lead = await ensureLeadRecord();
      const campaign = await ensureCampaignRecord();

      await api.sendEmail({
        leadId: lead._id,
        campaignId: campaign._id,
        subject: aiDraft.subject,
        body: aiDraft.body
      });

      setSendStatus('Sent ✔ Gmail thread updated');
      refreshLeads();
    } catch (error) {
      setSendStatus(error.message || 'Send failed');
    } finally {
      setIsSending(false);
    }
  }

  async function handleSyncReplies() {
    setSyncing(true);
    setSyncMessage('Syncing Gmail inbox...');
    try {
      const result = await api.syncReplies();
      const matchedCount = result.matched || 0;
      setSyncMessage(matchedCount > 0 
        ? `Found ${matchedCount} new reply(ies)!` 
        : `Checked ${result.count} messages, no new replies.`);
      
      // Refresh leads list to show updated statuses
      await refreshLeads();
    } catch (error) {
      setSyncMessage(error.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  }

  return (
    <div className="app-shell">
      <header className="hero-card">
        <div style={{ flex: '1', minWidth: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
            <p className="eyebrow" style={{ margin: 0 }}>AI-Powered Job Application Emails</p>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              {user && <span style={{ color: 'rgba(228, 232, 255, 0.8)', fontSize: '14px' }}>Welcome, {user.name}</span>}
              <button 
                onClick={handleLogout}
                className="btn ghost"
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Logout
              </button>
            </div>
          </div>
          <h1>PitchPilot · Smart Cold Emailer</h1>
          <p className="hero-copy">
            Paste a job description and your background. PitchPilot generates personalized emails to recruiters, sends them via Gmail, and tracks replies automatically.
          </p>
          <div className="hero-actions">
            <button className="btn primary" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? 'Thinking...' : 'Generate next email'}
            </button>
            <button className="btn ghost" onClick={handleSyncReplies} disabled={syncing}>
              {syncing ? 'Syncing…' : 'Sync Gmail replies'}
            </button>
            <span className="hero-status">{syncMessage}</span>
          </div>
        </div>
        <div className="hero-stats">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      </header>

      <main className="main-grid">
        <section className="panel">
          <div className="panel-heading">
            <h2>1 · Job description + Your background</h2>
            <p>Paste the job description, add your skills/experience, and find the recruiter's details.</p>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Job description</span>
              <textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={6} />
            </label>

            <label className="field">
              <span>Your background & skills</span>
              <textarea value={productPitch} onChange={(e) => setProductPitch(e.target.value)} rows={6} placeholder="Brief summary of your experience, skills, and why you're a good fit..." />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Recruiter name</span>
              <input value={leadForm.name} onChange={(e) => handleLeadChange('name', e.target.value)} placeholder="Sarah Chen" />
            </label>
            <label className="field">
              <span>Email</span>
              <input value={leadForm.email} onChange={(e) => handleLeadChange('email', e.target.value)} placeholder="sarah@techrecruiters.com" />
            </label>
            <label className="field">
              <span>Role</span>
              <input value={leadForm.role} onChange={(e) => handleLeadChange('role', e.target.value)} placeholder="Senior Technical Recruiter" />
            </label>
            <label className="field">
              <span>Company</span>
              <input value={leadForm.company} onChange={(e) => handleLeadChange('company', e.target.value)} placeholder="TechRecruiters Inc" />
            </label>
          </div>

          <div className="form-grid">
            <label className="field">
              <span>Recruiter's LinkedIn URL</span>
              <input value={leadForm.linkedinUrl} onChange={(e) => handleLeadChange('linkedinUrl', e.target.value)} placeholder="https://www.linkedin.com/in/recruiter-name" />
            </label>
            <label className="field">
              <span>Tone</span>
              <select value={tone} onChange={(e) => setTone(e.target.value)}>
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="confident">Confident</option>
              </select>
            </label>
            <label className="field">
              <span>Your email (for sending)</span>
              <input value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="your.email@gmail.com" />
            </label>
          </div>

          <div className="field" style={{ marginTop: '16px', padding: '16px', background: 'rgba(124, 92, 255, 0.08)', borderRadius: '12px', border: '1px solid rgba(124, 92, 255, 0.2)' }}>
            <span>Resume (PDF, DOC, DOCX - Max 5MB)</span>
            {resume ? (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                  ✓ {resume.originalName} (uploaded {new Date(resume.uploadedAt).toLocaleDateString()})
                </span>
                <button 
                  type="button"
                  onClick={handleDeleteResume}
                  className="btn subtle"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  disabled={uploadingResume}
                  style={{ 
                    width: '100%', 
                    padding: '8px',
                    background: 'rgba(4, 6, 18, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    color: '#f2f4ff',
                    cursor: uploadingResume ? 'not-allowed' : 'pointer'
                  }}
                />
                <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Your resume will be automatically attached to all emails you send
                </p>
              </div>
            )}
            {resumeStatus && (
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: resumeStatus.includes('success') ? '#8df2cb' : '#fca5a5' }}>
                {resumeStatus}
              </p>
            )}
          </div>

          <p className="status-line">{generateStatus}</p>
        </section>

        <section className="panel preview-panel">
          <div className="panel-heading">
            <h2>2 · AI draft + Gmail send</h2>
            <p>Review, tweak, and launch the email right from here.</p>
          </div>

          {linkedinNote && (
            <div className="insight-chip">
              <span>LinkedIn insight</span>
              <p>{linkedinNote}</p>
            </div>
          )}

          <label className="field">
            <span>Subject</span>
            <input value={aiDraft.subject} onChange={(e) => setAiDraft((prev) => ({ ...prev, subject: e.target.value }))} placeholder="Subject will appear here..." />
          </label>

          <label className="field">
            <span>Body</span>
            <textarea rows={10} value={aiDraft.body} onChange={(e) => setAiDraft((prev) => ({ ...prev, body: e.target.value }))} placeholder="Generate an email to populate..." />
          </label>

          <div className="field">
            <span>Campaign</span>
            <div className="campaign-row">
              <select value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
                <option value="new">Create new from this JD</option>
                {campaigns.map((campaign) => (
                  <option key={campaign._id} value={campaign._id}>
                    {campaign.title} · {campaign.status}
                  </option>
                ))}
              </select>
              <button className="btn subtle" onClick={refreshCampaigns}>
                Refresh
              </button>
            </div>
          </div>

          {resume && (
            <div style={{ 
              padding: '12px', 
              background: 'rgba(59, 212, 165, 0.1)', 
              border: '1px solid rgba(59, 212, 165, 0.3)', 
              borderRadius: '8px', 
              marginBottom: '12px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)'
            }}>
              📎 Your resume ({resume.originalName}) will be attached to this email
            </div>
          )}

          <div className="send-actions">
            <button className="btn primary" onClick={handleSend} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send via Gmail'}
            </button>
            <span className="status-line">{sendStatus}</span>
          </div>
        </section>
      </main>

      <section className="panel leads-panel">
        <div className="panel-heading">
          <h2>Application tracker</h2>
          <p>Track which recruiters have replied and manage your follow-ups.</p>
        </div>
        <div className="lead-list">
          {(leads || []).slice(0, 6).map((lead) => (
            <LeadRow key={lead._id} lead={lead} />
          ))}
          {leads.length === 0 && <p className="empty">No applications sent yet — generate your first email to a recruiter.</p>}
        </div>
      </section>
    </div>
  );
}

