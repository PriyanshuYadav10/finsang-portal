#!/usr/bin/env python3
"""Builds the Finsang 360 Career Program documents:
   - Finsang-360-Career-Program.(html|pdf)      8-page awareness brochure (landscape)
   - Finsang-360-Program-Guide.(html|pdf)       detailed 30-day program guide (portrait)
Each HTML file is standalone (logo inlined). PDFs are printed with headless Chrome.
Usage: python3 build.py            (needs Google Chrome and internet for web fonts)"""
import base64, html, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
LOGO = 'data:image/png;base64,' + base64.b64encode(open(os.path.join(HERE, '..', 'public', 'img', 'logo.png'), 'rb').read()).decode()

# ---- facts (edit here) ----
EMAIL = 'info@finsang.in'
PHONE = '+91\u00a09929760623'  # non-breaking space so the number never wraps
ORG = 'Finsang India Digital Solution Pvt. Ltd.'
CITY = 'Jaipur, Rajasthan'
FEE = '₹17,999'
E = html.escape

FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap" rel="stylesheet">'

# ======================= GUIDE CONTENT =======================
TRACKS = [
 dict(n='01', name='Software Development', mode='Hybrid', cat='Technology',
  intro='Go from programming basics to building and deploying a full-stack web application with real project experience.',
  sprints=[('Programming Fundamentals & Web Basics', 'Programming logic, HTML5, CSS3, responsive layouts', 'Personal Profile Page', 'Programming Fundamentals Notes, HTML & CSS Cheat Sheet'),
           ('JavaScript & Frontend Development', 'JavaScript in depth, the DOM, async code, React basics', 'JavaScript To-Do App', 'JavaScript Handbook, React Starter Slides'),
           ('Backend, Databases & APIs', 'Node.js and Express, SQL, REST API design', 'REST API for a Library', 'REST API Reference Guide, SQL Practice Workbook'),
           ('Git, Testing & Deployment', 'Git and GitHub, testing, code reviews, deploying an app', 'Practice deployment of your app', 'Git Command Guide'),
           ('Capstone & Career Preparation', 'Capstone build, demo prep, developer resume and portfolio', 'Capstone Project Proposal', 'Capstone Rubric, Developer Resume Template')],
  live='Teams of 3–4 build a small web product (for example an appointment booking tool or inventory tracker) against a brief shaped with the technology partner. Work is tracked in GitHub, reviewed in sprint demos and presented at the final showcase.',
  skills='HTML/CSS/JS, React basics, Node.js & APIs, SQL, Git & GitHub', careers='Junior Web Developer, Frontend Developer, Backend Trainee, QA / Test Associate'),
 dict(n='02', name='Digital Marketing', mode='Hybrid', cat='Marketing',
  intro='Learn SEO, social media, paid ads and analytics by running practical campaign assignments.',
  sprints=[('Digital Marketing Fundamentals', 'The marketing funnel, channels, tools and metrics', 'Weekly practice quiz', 'Digital Marketing Primer'),
           ('SEO & Search Console', 'Keyword research, on-page SEO, Search Console basics', 'Keyword Research Sheet', 'SEO Checklist, Keyword Research Template'),
           ('Social Media & Content Marketing', 'Content planning, social platforms, email basics', 'Social Content Calendar', 'Content Calendar Template, Social Media Playbook'),
           ('Paid Ads: Google & Meta', 'Account structure, targeting, budgets, ad copy', 'Google Ads Campaign Draft', 'Ads Account Structure Guide'),
           ('Analytics, Leads & Reporting', 'GA4, lead generation, reporting, portfolio and resume', 'Campaign Performance Report', 'Reporting Dashboard Template, Marketer Resume Template')],
  live='Learners plan and run a simulated campaign for a sample brief from the growth partner: strategy, content, ads setup, analytics and a final performance presentation.',
  skills='SEO, Google Ads, Meta Ads, Content marketing, Analytics', careers='Digital Marketing Executive, SEO Associate, Social Media Executive, Performance Marketing Trainee'),
 dict(n='03', name='UI/UX Designing', mode='Hybrid', cat='Design',
  intro='Learn user research, wireframing, Figma and prototyping, and finish with a job-ready design portfolio.',
  sprints=[('Design Fundamentals', 'Design principles, colour, typography, the UX process', 'Visual Hierarchy Poster', 'Design Principles Guide'),
           ('User Research & Strategy', 'Interviews, personas, research methods', 'User Interview Report', 'Interview Script Template, Research Methods Deck'),
           ('Wireframing, Flows & Figma', 'Wireframes, user flows, UI components, auto-layout', 'Mobile App Wireframes', 'Figma Shortcuts Cheat Sheet'),
           ('Design Systems & Prototyping', 'Design systems, interactive prototypes, usability testing', 'Design System Starter', 'Usability Test Plan Template'),
           ('Portfolio & Career Prep', 'Case studies, portfolio review, mock design interviews', 'Portfolio case study', 'Case Study Template, Designer Resume Template')],
  live='Teams work through a design sprint on a brief from the technology partner: research, flows, UI, prototype and a usability test readout presented to mentors.',
  skills='Figma, User research, Wireframing, Prototyping, Design systems', careers='UI Designer, UX Designer Trainee, Product Design Intern, Visual Designer'),
 dict(n='04', name='Sales & Business Development', mode='Hybrid', cat='Business',
  intro='Build communication, CRM and client acquisition skills through practical outreach and pipeline exercises.',
  sprints=[('Sales Fundamentals', 'Sales basics, buyer psychology, product knowledge', 'Elevator Pitch Recording', 'Sales Fundamentals Guide'),
           ('Communication & Negotiation', 'Communication skills, objection handling, negotiation', 'Weekly role-play assessment', 'Objection Handling Playbook, Negotiation Slides'),
           ('Lead Generation & CRM', 'Finding and qualifying leads, CRM management', 'Lead List Building', 'Lead Qualification Template'),
           ('Outreach & Pipeline', 'Cold calling, email outreach, pipeline management', 'Email Outreach Sequence', 'Email Templates Pack'),
           ('Business Development & Career Prep', 'Account growth, pipeline review, mock interviews, resume', 'Pipeline Review Report', 'Sales Resume Template')],
  live='Learners run a simulated outreach campaign for a sample business: build lists, craft outreach, log activity in a CRM and present pipeline results to mentors.',
  skills='Negotiation, Lead generation, CRM tools, Cold outreach, Pipeline management', careers='Sales Executive, Business Development Associate, Inside Sales Representative, Account Coordinator'),
 dict(n='05', name='E-commerce Management', mode='Hybrid', cat='Commerce',
  intro='Learn marketplace selling, catalog and inventory management, advertising and analytics for online stores.',
  sprints=[('E-commerce Fundamentals', 'E-commerce models, marketplaces, product research', 'Product Research Brief', 'E-commerce Fundamentals Guide'),
           ('Listings & Catalog Management', 'Listing optimisation, catalog uploads', 'Optimised Listing', 'Listing Optimisation Checklist, Catalog Upload Template'),
           ('Inventory & Order Management', 'Stock planning, orders, fulfilment', 'Inventory Plan', 'Inventory Planning Sheet'),
           ('Marketplace Advertising & Analytics', 'Marketplace ads, optimisation, analytics', 'Ads optimisation practice', 'Ads Optimisation Guide, Analytics Slides'),
           ('Growth Strategy & Career Prep', 'Growth planning, mock interviews, resume', 'Store Growth Plan', 'E-commerce Resume Template')],
  live='Learners manage a simulated marketplace store: research, listing, catalog, inventory, ads and analytics, ending with a growth-plan presentation to partner mentors.',
  skills='Marketplace selling, Catalog management, Inventory & orders, Marketplace ads, E-commerce analytics', careers='E-commerce Executive, Catalog Associate, Marketplace Account Manager, Operations Coordinator'),
]
DAYS = ['Days 1–6', 'Days 7–12', 'Days 13–18', 'Days 19–24', 'Days 25–30']

GUIDE_CSS = r'''
@page{size:210mm 297mm;margin:0}
:root{--ink:#0e0d0b;--gold:#d4b36a;--gold2:#e6ca83;--gd:#8a6a1f;--paper:#f5f4ef;--line:#e0dccf;--mut:#6b685f}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',system-ui,sans-serif;color:var(--ink);font-size:13.8px;line-height:1.6;-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
@media screen{body{background:#d9d6cb;padding:24px 0}.page{margin:0 auto 24px}}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;break-after:page;padding:17mm 17mm 20mm;background:#fff}
.page:last-child{page-break-after:auto;break-after:auto}
.hd{display:flex;justify-content:space-between;align-items:center;padding-bottom:9px;border-bottom:2px solid var(--gold);margin-bottom:9mm}
.brand{display:flex;align-items:center;gap:9px}.brand img{width:11mm;height:11mm;border-radius:50%}.brand b{display:block;font-size:14px;line-height:1.1}.brand span{display:block;font-size:8.5px;font-weight:800;letter-spacing:.17em;color:var(--gd)}
.sec{font-size:9.5px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}
.ft{position:absolute;left:17mm;right:17mm;bottom:9mm;display:flex;justify-content:space-between;font-size:9.5px;color:#8a877b;border-top:1px solid var(--line);padding-top:6px}
h1,h2,h3{font-family:'Playfair Display',Georgia,serif;letter-spacing:-.02em;line-height:1.12}
h2{font-size:34px;font-weight:800;margin-bottom:6px}h2 em{font-style:normal;color:var(--gd)}
h3{font-size:17.5px;font-weight:700;margin-bottom:6px}
.eye{font-size:10.5px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:var(--gd);margin-bottom:6px}
.lead{font-size:15.5px;line-height:1.6;color:#4a4841;margin:8px 0 14px}
p{margin-bottom:8px;color:#34322c}
.card{border:1px solid var(--line);background:#fff;padding:17px 19px}.card.g{border-left:4px solid var(--gold);background:#fcfbf7}
.dk{background:var(--ink);color:#fff;border:0}.dk ul.ck li{color:rgba(255,255,255,.9)}.dk p{color:rgba(255,255,255,.9)}.dk p,.dk li{color:rgba(255,255,255,.88)}.dk h3{color:#fff}.dk em{color:var(--gold)}
.gd{background:linear-gradient(0deg,#e9d4a0,#e9d4a0)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
ul.ck{list-style:none}ul.ck li{position:relative;padding:3px 0 3px 20px;color:#34322c}ul.ck li::before{content:'✓';position:absolute;left:0;color:var(--gd);font-weight:800}.dk ul.ck li::before{color:var(--gold)}
table{width:100%;border-collapse:collapse;font-size:12.6px}th{background:var(--ink);color:var(--gold2);text-align:left;padding:10px 12px;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase}
td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}tr:nth-child(even) td{background:#faf8f1}td b{color:var(--ink)}
.tag{display:inline-block;font-size:9.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:3px 9px;background:#efe9d6;color:#5a4710;margin:0 5px 4px 0}
.note{font-size:11.6px;color:var(--mut);line-height:1.5}
.big{font-family:'Playfair Display',serif;font-weight:800;font-size:30px;color:var(--gd);line-height:1}
.steps{counter-reset:s}.step{display:flex;gap:14px;padding:13px 0;border-bottom:1px solid var(--line)}.step:last-child{border:0}.step i{flex:none;width:30px;height:30px;border-radius:50%;background:var(--ink);color:var(--gold2);display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px}.step b{display:block}.step span{color:#4a4841;font-size:13.2px}
.mt{margin-top:14px}.mt2{margin-top:24px}
/* cover */
.cover{background:var(--ink);color:#fff;padding:20mm 18mm}.cover::before{content:'';position:absolute;inset:0;background:radial-gradient(520px 520px at 90% 8%,rgba(212,179,106,.28),transparent 62%),radial-gradient(rgba(255,255,255,.05) 1px,transparent 1.4px) 0 0/22px 22px}
.cover>*{position:relative}.cover>.ft{position:absolute}.cover .brand b{color:#fff;font-size:18px}.cover .brand span{color:var(--gold)}.cover .brand img{width:15mm;height:15mm}
.cover h1{font-size:62px;font-weight:800;line-height:1.02;margin:62mm 0 8mm}.cover h1 em{font-style:normal;color:var(--gold)}
.cover p{color:rgba(255,255,255,.82);font-size:18px;max-width:135mm;line-height:1.5}
.chips{display:flex;gap:9px;flex-wrap:wrap;margin-top:12mm}.chips span{border:1px solid rgba(255,255,255,.25);padding:9px 18px;border-radius:99px;font-weight:700;font-size:13px}.chips span.g{background:var(--gold);color:var(--ink);border-color:var(--gold)}
.cover .ft{border-color:rgba(255,255,255,.15);color:rgba(255,255,255,.55)}
.toc a{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dotted #cfc9b5;color:var(--ink);text-decoration:none;font-weight:600}.toc span{color:var(--gd);font-weight:800}
.week{border:1px solid var(--line);border-top:4px solid var(--gold);padding:15px 16px}.week .d{font-size:9.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--gd)}.week b{display:block;font-size:15.5px;margin:3px 0 4px;font-family:'Playfair Display',serif}
.tl{position:relative;margin:6px 0 4px}.tl .row{display:grid;grid-template-columns:26mm 1fr;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)}.tl .row:last-child{border:0}.tl .day{font-weight:800;color:var(--gd);font-size:12.8px}
.trackhd{background:var(--ink);color:#fff;padding:14px 16px;margin:-2px 0 10px;display:flex;justify-content:space-between;align-items:center;gap:14px}.trackhd .n{font-family:'Playfair Display',serif;font-weight:800;font-size:40px;color:var(--gold);line-height:1}.trackhd h2{color:#fff;font-size:30px;margin:0}.trackhd p{color:rgba(255,255,255,.78);margin:4px 0 0;font-size:12.8px}
.tv{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap}
.tp table{font-size:11.8px}.tp td{padding:8px 11px}.tp th{padding:8px 11px}.tp .card{padding:13px 16px}.tp .mt2{margin-top:15px}.tp h3{font-size:16px}.tp .trackhd{padding:12px 16px;margin-bottom:8px}.tp .trackhd h2{font-size:27px}.tp .trackhd .n{font-size:34px}.tp .card p{font-size:12.4px!important}.tp .mt{margin-top:10px}
'''

def head(label, page):
    return f'''<div class="hd"><div class="brand"><img src="{{{{LOGO}}}}" alt=""><div><b>Finsang</b><span>360° CAREER PROGRAM</span></div></div><div class="sec">{label}</div></div>'''
def foot(page):
    return f'<div class="ft"><span>Finsang 360° Career Program · Program Guide</span><span>{page}</span></div>'

pages = []
def page(inner, cls='', n=None):
    pages.append(f'<section class="page {cls}">{inner}{foot(n) if n else ""}</section>')

# 1 cover
pages.append(f'''<section class="page cover"><div class="brand"><img src="{{{{LOGO}}}}" alt=""><div><b>Finsang</b><span>360° CAREER PROGRAM</span></div></div>
<h1>Your 30-day guide to a career, <em>or a company.</em></h1>
<p>The complete guide to the Finsang 360° Career Program: how the 30 days work, what you learn in each track, how you are assessed and certified, and how we support your career or startup.</p>
<div class="chips"><span class="g">30 days</span><span>5 career tracks</span><span>One fee · {FEE}</span><span>Startup support included</span></div>
<div class="ft"><span>Program Guide · for students &amp; colleges</span><span>{ORG}</span></div></section>''')

# 2 welcome + contents
toc = [('Program overview',3),('Your 30 days at a glance',4),('Getting started',5),('Using your student portal',6),('Track 1 · Software Development',7),('Track 2 · Digital Marketing',8),('Track 3 · UI/UX Designing',9),('Track 4 · Sales & Business Development',10),('Track 5 · E-commerce Management',11),('Choosing your track',12),('Assessment & certification',13),('Career guidance',14),('Startup support: the 30-day Founder Sprint',15),('Founder Sprint: deliverables & support',16),('Fees & benefits',17),('Frequently asked questions',18),('Contact & next steps',19)]
page(head('Welcome',2)+f'''<div class="eye">Welcome</div><h2>Welcome to the <em>360° Career Program.</em></h2>
<p class="lead">Whether you want your first job, a better one, or a business of your own, the next 30 days are designed to move you from learning to launch, with mentors, projects and a verifiable certificate along the way.</p>
<div class="card g"><b>How to use this guide.</b> Read pages 3–6 first: they explain how the program works. Then jump to your chosen track (pages 7–11). Pages 13–16 cover assessment, careers and startup support. Page 19 has our contact details.</div>
<h3 class="mt2">Contents</h3><div class="toc">{''.join(f'<a><div>{t}</div><span>{p}</span></a>' for t,p in toc)}</div>''',n=2)

# 3 overview
page(head('Program overview',3)+f'''<div class="eye">Overview</div><h2>One program. <em>Five careers.</em> One fee.</h2>
<p class="lead">The Finsang 360° Career Program is an industry-oriented, 30-day program from {ORG}, delivered with technology partner GrainZap IT Solutions and growth partner Growth Digital.</p>
<table><tr><th style="width:38mm">Item</th><th>Details</th></tr>
<tr><td><b>Program</b></td><td>Finsang 360° Career Program</td></tr><tr><td><b>Duration</b></td><td>30 days of guided learning</td></tr>
<tr><td><b>Tracks</b></td><td>Software Development · Digital Marketing · UI/UX Designing · Sales &amp; Business Development · E-commerce Management</td></tr>
<tr><td><b>Fee</b></td><td>{FEE}, one time. One payment unlocks all five tracks. Payable after your application is approved.</td></tr>
<tr><td><b>Modes</b></td><td>Hybrid, for every track</td></tr>
<tr><td><b>Who can apply</b></td><td>Students, freshers, graduates and aspiring professionals. Each track lists its own eligibility criteria.</td></tr>
<tr><td><b>You finish with</b></td><td>A portfolio of projects, a verifiable certificate, career guidance and, if you want it, a plan to start your own business</td></tr></table>
<h3 class="mt2">What is included in your fee</h3>
<div class="grid2"><ul class="ck"><li>Access to all five career tracks</li><li>Video lessons, notes and templates</li><li>Quizzes, topic tests and a full mock test</li><li>Assignments reviewed by mentors</li><li>A live project in your track</li></ul>
<ul class="ck"><li>A verifiable certificate on completion</li><li>Career guidance: resume, portfolio, mock interviews</li><li>Placement assistance* with partner openings</li><li>End-to-end startup support (Founder Sprint)</li><li>A personal dashboard to track everything</li></ul></div>
<p class="note mt2">*Placement assistance means resume support, mock interviews and access to partner openings. It is not a guarantee of employment.</p>''',n=3)

# 4 30 days
sprint_names=['Foundations','Core skills','Build','Apply & deploy','Capstone & launch']
page(head('Your 30 days',4)+f'''<div class="eye">The plan</div><h2>Your 30 days <em>at a glance.</em></h2>
<p class="lead">The program runs as five 6-day sprints. Every sprint has a focus, a module of video lessons and notes, a practice quiz and, in most sprints, an assignment reviewed by a mentor.</p>
<div class="tl">{''.join(f'<div class="row"><div class="day">{DAYS[i]}</div><div><b>Sprint {i+1} · {sprint_names[i]}</b><br><span style="color:#4a4841">{["Learn the fundamentals of your track and set up your tools and dashboard.","Go deeper into the core skills you will use every day on the job.","Start building real work: guided exercises and your first major assignment.","Apply what you know: advanced topics, practice campaigns or deployments, and mentor reviews.","Complete your capstone or live project, finish the mock test and prepare to launch."][i]}</span></div></div>' for i in range(5))}</div>
<h3 class="mt2">Checkpoints along the way</h3>
<div class="grid3"><div class="week"><div class="d">After each sprint</div><b>Practice quiz</b>Check your understanding before moving on.</div><div class="week"><div class="d">Days 25–28</div><b>Mock test</b>A full-length mock test and sample papers to rehearse the final assessment.</div><div class="week"><div class="d">Day 30</div><b>Final evaluation</b>Your progress, scores and attendance are checked for certification.</div></div>
<h3 class="mt2">Suggested daily rhythm</h3>
<div class="card g"><p style="margin-bottom:4px">Plan for about <b>2 hours a day</b>: watch the day's lesson, read the notes or template, then complete the practice task or assignment step. Live sessions and exam dates are announced on your dashboard, so check Announcements each day.</p><p class="note" style="margin:0">Falling behind? Tell your mentor early. Attendance and progress count towards certification (see page 13).</p></div>''',n=4)

# 5 getting started
page(head('Getting started',5)+f'''<div class="eye">Admission</div><h2>Getting <em>started.</em></h2>
<p class="lead">Joining takes six simple steps. Most students are ready to start learning within a few days of applying.</p>
<div class="steps">
<div class="step"><i>1</i><div><b>Choose your primary track</b><span>Pick the track you will follow for your guided 30 days. You can still explore the other four.</span></div></div>
<div class="step"><i>2</i><div><b>Apply with your resume</b><span>Share your details, college or workplace, qualification and a resume. You receive an application ID.</span></div></div>
<div class="step"><i>3</i><div><b>Get approved</b><span>Our admissions team reviews your application. You can check its status any time with your application ID and email.</span></div></div>
<div class="step"><i>4</i><div><b>Pay your one-time fee</b><span>The fee is {FEE} and is payable after approval. It unlocks all five tracks.</span></div></div>
<div class="step"><i>5</i><div><b>Log in to your dashboard</b><span>Use the email and password you created while applying. Change your password from the account menu.</span></div></div>
<div class="step"><i>6</i><div><b>Start Day 1</b><span>Open your track, watch the first lesson and read the announcements for your batch.</span></div></div></div>
<div class="grid2 mt2"><div class="card g"><h3>Keep these ready</h3><ul class="ck"><li>An up-to-date resume (PDF or Word)</li><li>Your college or workplace details</li><li>A working email and mobile number</li><li>A laptop or desktop and a stable connection</li></ul></div>
<div class="card g"><h3>Your Day 1 checklist</h3><ul class="ck"><li>Log in and change your password</li><li>Upload your resume on the Placement page</li><li>Open your track and watch lesson 1</li><li>Read the Announcements</li><li>Note your first assignment's deadline</li></ul></div></div>''',n=5)

# 6 portal
portal=[('Dashboard','Your progress ring, attendance, scores, next lesson and pending assignments in one place.'),('My Programs','See your track, mentor, dates and the full curriculum. Switch between the five tracks.'),('Learning Materials','Download notes, cheat sheets, templates and slides, organised by module.'),('Video Learning','Watch lessons in order. Completed lessons count towards your progress.'),('Papers & Assessments','Practice quizzes, topic tests, sample and previous papers, and the full mock test.'),('Assignments','Read the brief, upload your work or share a link, and receive marks and feedback.'),('Announcements','Live-session schedules, deadlines, exam dates and program updates.'),('Certificates','Check your eligibility, request your certificate and download it with its verification ID.'),('Placement','Browse jobs and internships, apply, track interviews and upload your resume.')]
page(head('Student portal',6)+f'''<div class="eye">Your dashboard</div><h2>Using your <em>student portal.</em></h2>
<p class="lead">Everything you need is inside your personal dashboard. Here is what each section does.</p>
<div class="grid3">{''.join(f'<div class="card g" style="min-height:34mm"><div class="big" style="font-size:22px">{i+1:02d}</div><h3 style="margin-top:4px">{t}</h3><p style="font-size:12.8px;margin:0">{d}</p></div>' for i,(t,d) in enumerate(portal))}</div>
<div class="card dk mt2"><h3>Tips to stay on track</h3><ul class="ck"><li>Check the dashboard daily: the "Up next" card shows your next lesson.</li><li>Submit assignments before the deadline. Work marked "Overdue" is shown in red.</li><li>Use the search (Ctrl or ⌘ + K) to jump to any lesson or page quickly.</li><li>Open the bell icon for reminders about deadlines and announcements.</li></ul></div>''',n=6)

# 7-11 tracks
for i,t in enumerate(TRACKS):
    rows=''.join(f'<tr><td><b>{DAYS[j]}</b></td><td><b>{E(s[0])}</b><br>{E(s[1])}</td><td>{E(s[2])}</td><td>{E(s[3])}</td></tr>' for j,s in enumerate(t['sprints']))
    page(head(f'Track {i+1} of 5',7+i)+f'''<div class="trackhd"><div><div class="eye" style="color:var(--gold);margin-bottom:2px">{E(t['cat'])} · 30 days · {t['mode']}</div><h2>{E(t['name'])}</h2><p>{E(t['intro'])}</p></div><div class="n">{t['n']}</div></div>
<h3>Your 30-day plan</h3><table><tr><th style="width:21mm">When</th><th>Sprint &amp; what you learn</th><th style="width:34mm">Assignment / task</th><th style="width:44mm">Notes &amp; templates</th></tr>{rows}</table>
<div class="grid2 mt2"><div class="card g"><h3>Live project</h3><p style="margin:0;font-size:13px">{E(t['live'])}</p></div>
<div class="card g"><h3>Skills you will build</h3><div class="tv">{''.join(f'<span class="tag">{E(x.strip())}</span>' for x in t['skills'].split(','))}</div><h3 style="margin-top:8px">Career paths</h3><p style="margin:0;font-size:13px">{E(t['careers'])}</p></div></div>
<div class="card dk mt"><b>Assessed through:</b> sprint quizzes, mentor-reviewed assignments, the live project, a full mock test and a final evaluation. Mode: <b>{t['mode']}</b>.</div>''',cls='tp',n=7+i)

# 12 choosing
page(head('Choosing your track',12)+f'''<div class="eye">Pick your path</div><h2>Choosing your <em>track.</em></h2>
<p class="lead">Your single fee unlocks all five tracks. Choose one as your primary track for the guided 30 days, then explore the others on the same login.</p>
<table><tr><th>If you enjoy…</th><th style="width:44mm">Choose</th><th style="width:40mm">Good for</th></tr>
<tr><td>Solving problems with logic and building things people use</td><td><b>Software Development</b></td><td>Developer, QA and tech roles</td></tr>
<tr><td>Growing audiences, campaigns, numbers and creative content</td><td><b>Digital Marketing</b></td><td>Marketing and performance roles</td></tr>
<tr><td>Understanding people and making products easy and beautiful</td><td><b>UI/UX Designing</b></td><td>Design and product roles</td></tr>
<tr><td>Talking to people, negotiating and winning clients</td><td><b>Sales &amp; Business Development</b></td><td>Sales and account roles</td></tr>
<tr><td>Selling products online and running a store</td><td><b>E-commerce Management</b></td><td>Marketplace and operations roles</td></tr></table>
<h3 class="mt2">Combinations that work well</h3>
<div class="grid2"><div class="card g"><b>Product builder</b><p style="margin:3px 0 0">Software Development + UI/UX Designing: design it, then build it.</p></div><div class="card g"><b>Online business</b><p style="margin:3px 0 0">E-commerce Management + Digital Marketing: list it, then drive traffic.</p></div><div class="card g"><b>Growth role</b><p style="margin:3px 0 0">Digital Marketing + Sales &amp; Business Development: generate and close demand.</p></div><div class="card g"><b>Founder</b><p style="margin:3px 0 0">Any track plus the Founder Sprint (pages 15–16) to turn your idea into a business.</p></div></div>
<div class="card dk mt2"><h3>Can I switch tracks?</h3><p style="margin:0">Yes. Use the program switcher in your dashboard at any time. Your guided 30-day plan follows your primary track, so if you switch, talk to your mentor about re-planning your assignments and live project.</p></div>''',n=12)

# 13 assessment
page(head('Assessment & certification',13)+f'''<div class="eye">Proof of skill</div><h2>Assessment &amp; <em>certification.</em></h2>
<p class="lead">You are assessed continuously, so there are no surprises on the last day. Meeting the completion criteria earns a certificate with a unique ID that anyone can verify.</p>
<h3>How you are assessed</h3>
<div class="grid2"><ul class="ck"><li><b>Sprint quizzes:</b> multiple-choice practice after every sprint</li><li><b>Assignments:</b> marked by a mentor with written feedback</li><li><b>Live project:</b> reviewed in demos and presented to mentors</li></ul><ul class="ck"><li><b>Mock test:</b> a full-length test (50 questions, 90 minutes)</li><li><b>Sample &amp; previous papers:</b> to rehearse the format</li><li><b>Final evaluation:</b> on Day 30</li></ul></div>
<h3 class="mt2">Practice papers in every track</h3>
<table><tr><th>Paper</th><th>Type</th><th>Questions</th><th>Time</th></tr><tr><td>Sample Question Paper 1 (Foundation)</td><td>Sample</td><td>25</td><td>45 min</td></tr><tr><td>Sample Question Paper 2 (Intermediate)</td><td>Sample</td><td>30</td><td>60 min</td></tr><tr><td>Previous Assessment Paper 1</td><td>Previous</td><td>20</td><td>40 min</td></tr><tr><td>Previous Assessment Paper 2</td><td>Previous</td><td>25</td><td>50 min</td></tr><tr><td>Full-Length Mock Test</td><td>Mock</td><td>50</td><td>90 min</td></tr></table>
<h3 class="mt2">Certificate criteria</h3>
<div class="grid3"><div class="week"><div class="d">Learning progress</div><b>80%</b>of lessons completed</div><div class="week"><div class="d">Assessment score</div><b>60%</b>average score</div><div class="week"><div class="d">Attendance</div><b>75%</b>of sessions</div></div>
<p class="note mt">These are the current completion criteria and may be updated by the program team. Your dashboard shows your live status and tells you when you are eligible.</p>
<div class="card g mt"><b>Verifiable certificate.</b> Each certificate carries a unique ID (for example FSC-2026-0001). Employers and colleges can check its authenticity with the Finsang team.</div>''',n=13)

# 14 career guidance
page(head('Career guidance',14)+f'''<div class="eye">After the 30 days</div><h2>Career <em>guidance.</em></h2>
<p class="lead">Career preparation is built into the plan, not left to the end. Every track includes a resume template and portfolio work, and the final sprint focuses on interviews.</p>
<table><tr><th style="width:30mm">When</th><th>What you do</th><th style="width:48mm">What you get</th></tr>
<tr><td><b>Days 1–6</b></td><td>Set career goals with your mentor; upload your current resume</td><td>Personal roadmap</td></tr>
<tr><td><b>Days 7–18</b></td><td>Build portfolio pieces from your assignments as you go</td><td>Mentor feedback on work</td></tr>
<tr><td><b>Days 19–24</b></td><td>Polish your resume with your track's template; prepare your profile</td><td>Resume review</td></tr>
<tr><td><b>Days 25–30</b></td><td>Mock interviews, project presentation, job and internship search</td><td>Interview practice, partner openings*</td></tr></table>
<h3 class="mt2">The Placement section of your dashboard</h3>
<div class="grid2"><ul class="ck"><li>Jobs and internships posted by Finsang and partners</li><li>Apply in one click with your uploaded resume</li><li>Track the status of every application</li></ul><ul class="ck"><li>See interview dates, times and modes</li><li>A placement-readiness score from your progress, scores and attendance</li><li>Resume templates for every track</li></ul></div>
<div class="grid2 mt2"><div class="card dk"><h3>Partner exposure</h3><p style="margin:0">Industry sessions and project briefs from GrainZap (technology) and Growth Digital (marketing and growth) give you a view of how real teams work.</p></div><div class="card g"><h3>Not sure about your path?</h3><p style="margin:0">Talk to your mentor in Week 1. You can combine career preparation with the Founder Sprint, or switch your plan as you learn what you enjoy.</p></div></div>
<p class="note mt2">*Placement assistance means resume support, mock interviews and access to partner openings. It is not a guarantee of employment. Hiring decisions are made by employers.</p>''',n=14)

# 15 founder sprint
page(head('Startup support',15)+f'''<div class="eye">For future founders</div><h2>The 30-day <em>Founder Sprint.</em></h2>
<p class="lead">Want to start a business instead of, or alongside, a job? Join the Founder Sprint: a structured, mentor-guided path from idea to first customers, running in parallel with your track.</p>
<table><tr><th style="width:26mm">When</th><th>Milestone</th><th>You produce</th></tr>
<tr><td><b>Week 1<br>Days 1–7</b></td><td><b>Validate.</b> Define the problem and your customer; hold at least 10 customer conversations; test whether people will pay.</td><td>Problem statement · customer profile · validation scorecard</td></tr>
<tr><td><b>Week 2<br>Days 8–14</b></td><td><b>Model.</b> Shape the business model, pricing and unit costs; scan competitors; choose your name and brand identity.</td><td>One-page business model · pricing sheet · brand basics</td></tr>
<tr><td><b>Week 3<br>Days 15–21</b></td><td><b>Build.</b> Scope your first product or service with technology and marketing mentors; create a landing page and outreach plan.</td><td>MVP scope · landing page · outreach plan</td></tr>
<tr><td><b>Week 4<br>Days 22–30</b></td><td><b>Launch &amp; pitch.</b> Soft-launch to first customers; run a small campaign; practise your pitch; review compliance and registration steps.</td><td>Pitch deck · launch report · compliance checklist · 90-day plan</td></tr></table>
<div class="grid2 mt2"><div class="card g"><h3>Why it works inside the 360° program</h3><p style="margin:0">Your track skills become your startup toolkit: build with Software, brand with Design, promote with Digital Marketing, sell with Sales, and operate online with E-commerce.</p></div>
<div class="card dk"><h3>Who should join</h3><ul class="ck"><li>You have an idea, or want help finding one</li><li>You want to work on your own venture</li><li>You can commit time to customer conversations</li></ul></div></div>''',n=15)

# 16 founder deliverables
page(head('Startup support',16)+f'''<div class="eye">For future founders</div><h2>Founder Sprint: deliverables <em>&amp; support.</em></h2>
<p class="lead">By Day 30 you leave with real assets you can show to customers, partners and mentors.</p>
<div class="grid3">{''.join(f'<div class="card g" style="min-height:30mm"><div class="big" style="font-size:22px">{i+1:02d}</div><h3 style="margin-top:3px">{t}</h3><p style="font-size:12.6px;margin:0">{d}</p></div>' for i,(t,d) in enumerate([('Validated idea','Evidence from real customers that the problem is worth solving.'),('Business model & pricing','A one-page plan covering customers, revenue, costs and pricing.'),('Brand & online presence','A name, simple identity, landing page and social profiles.'),('First product (MVP)','A clearly scoped first version, with technology mentor guidance.'),('Launch plan & first customers','Outreach, campaign and sales steps to win your first users.'),('Pitch & compliance readiness','A pitch deck, plus a checklist of registrations and basics to review.')]))}</div>
<h3 class="mt2">How we support you</h3>
<div class="grid2"><ul class="ck"><li><b>Mentor sessions</b> with industry mentors from technology, marketing and business</li><li><b>Weekly checkpoints</b> to review your milestone and unblock you</li><li><b>Templates</b> for interviews, business models, pitches and checklists</li></ul><ul class="ck"><li><b>Practice</b> for pitching, sales calls and customer discovery</li><li><b>Career guidance</b> as a safety net if you decide to take a job first</li><li><b>Feedback</b> on your pitch, pricing and launch plan from mentors</li></ul></div>
<div class="card dk mt2"><h3>Good to know</h3><p style="margin:0 0 6px">Startup support is mentorship and guidance. It does not include investment or funding, and outcomes depend on the founder's effort and market conditions. Legal, tax and registration questions should be confirmed with qualified professionals; we help you know what to ask.</p></div>
<div class="card g mt"><b>Ready to start?</b> Tell us about your idea when you apply, or speak to the admissions team on {PHONE}.</div>''',n=16)

# 17 fees
page(head('Fees & benefits',17)+f'''<div class="eye">Simple pricing</div><h2>Fees &amp; <em>benefits.</em></h2>
<p class="lead">One payment of <b>{FEE}</b> covers the whole program. There are no per-track fees and no hidden add-ons.</p>
<table><tr><th>What you get</th><th style="width:28mm">Included</th></tr>
<tr><td>All five career tracks</td><td><b>Yes</b></td></tr><tr><td>Video lessons, notes, cheat sheets and templates</td><td><b>Yes</b></td></tr><tr><td>Quizzes, sample papers and a full mock test</td><td><b>Yes</b></td></tr><tr><td>Mentor-reviewed assignments and a live project</td><td><b>Yes</b></td></tr><tr><td>Verifiable certificate on completion</td><td><b>Yes</b></td></tr><tr><td>Resume templates and career guidance</td><td><b>Yes</b></td></tr><tr><td>Mock interviews and partner openings*</td><td><b>Yes</b></td></tr><tr><td>Founder Sprint: end-to-end startup support</td><td><b>Yes</b></td></tr><tr><td>Personal dashboard, announcements and reminders</td><td><b>Yes</b></td></tr></table>
<div class="grid2 mt2"><div class="card g"><h3>Admission &amp; payment</h3><ul class="ck"><li>Apply first; pay after approval</li><li>One-time fee of {FEE}</li><li>Payment details are shared by the admissions team</li></ul></div>
<div class="card g"><h3>Program policies</h3><ul class="ck"><li>Submit original work and follow program guidelines</li><li>Certificates are issued only on meeting the published criteria</li><li>Placement support is assistance only</li></ul></div></div>
<p class="note mt2">*Placement assistance means resume support, mock interviews and access to partner openings. It is not a guarantee of employment.</p>''',n=17)

# 18 FAQ
faqs=[('Is this a guaranteed job program?','No. We provide placement assistance: resume support, mock interviews and access to partner openings. Employment is never guaranteed and depends on your performance and employer decisions.'),('How long is the program?','30 days of guided learning, organised into five 6-day sprints.'),('Do I have to pay for each track?','No. A single one-time fee of '+FEE+' gives you access to all five tracks.'),('Who can apply?','Students, freshers, graduates and aspiring professionals. Each track lists its own eligibility criteria.'),('Can I do more than one track?','Your guided 30-day plan follows one primary track. All five are unlocked, so you can explore the others using the same login.'),('I want to start a business. Can you help?','Yes. The Founder Sprint gives you mentorship and guidance from idea validation to your first customers. See pages 15–16.'),('How do I get a certificate?','Meet the completion criteria (progress, assessment score and attendance). Every certificate has a unique ID that can be verified.'),('What do I need to join?','A resume, a working email and phone number, and a laptop or desktop with a stable internet connection.')]
page(head('FAQ',18)+f'''<div class="eye">Questions</div><h2>Frequently asked <em>questions.</em></h2><div class="mt">{''.join(f'<div class="card g" style="margin-bottom:8px"><b>{E(q)}</b><p style="margin:3px 0 0;font-size:12px">{E(a)}</p></div>' for q,a in faqs)}</div>''',n=18)

# 19 contact
page(head('Contact',19)+f'''<div class="eye">Next steps</div><h2>Start your <em>360° journey.</em></h2>
<p class="lead">Speak to the Finsang admissions team or your campus coordinator to register. We are happy to answer questions from students, parents and colleges.</p>
<div class="card dk" style="padding:18px 20px"><table style="font-size:14px"><tr><td style="background:none;border-color:rgba(255,255,255,.15);width:28mm;color:var(--gold);font-weight:800;letter-spacing:.12em;font-size:10.5px">EMAIL</td><td style="background:none;border-color:rgba(255,255,255,.15);color:#fff;font-weight:600">{EMAIL}</td></tr>
<tr><td style="background:none;border-color:rgba(255,255,255,.15);color:var(--gold);font-weight:800;letter-spacing:.12em;font-size:10.5px">PHONE</td><td style="background:none;border-color:rgba(255,255,255,.15);color:#fff;font-weight:600">{PHONE}</td></tr>
<tr><td style="background:none;border-color:rgba(255,255,255,.15);color:var(--gold);font-weight:800;letter-spacing:.12em;font-size:10.5px">ORGANISER</td><td style="background:none;border-color:rgba(255,255,255,.15);color:#fff;font-weight:600">{ORG}, {CITY}</td></tr>
<tr><td style="background:none;border:0;color:var(--gold);font-weight:800;letter-spacing:.12em;font-size:10.5px">PARTNERS</td><td style="background:none;border:0;color:#fff;font-weight:600">GrainZap IT Solutions · Growth Digital</td></tr></table></div>
<h3 class="mt2">What happens next</h3>
<div class="steps"><div class="step"><i>1</i><div><b>Get in touch</b><span>Call or email us with your chosen track, or tell us about your startup idea.</span></div></div><div class="step"><i>2</i><div><b>Apply with your resume</b><span>Our team reviews and approves your application.</span></div></div><div class="step"><i>3</i><div><b>Pay once, start learning</b><span>Your {FEE} fee unlocks all five tracks and the Founder Sprint.</span></div></div></div>
<p class="note mt2">*Placement assistance is not a guarantee of employment. Startup support is mentorship and guidance. Details in this guide may be updated by the Finsang team.</p>''',n=19)

GUIDE = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Finsang 360° Career Program: Program Guide</title>{FONTS}<style>{GUIDE_CSS}</style></head><body>{''.join(pages)}</body></html>'''

LOGO_CSS = ':root{--logo:url(' + LOGO + ')}.lg{display:block;aspect-ratio:1;border-radius:50%}.brand .lg,.arch .lg{background:var(--logo) center/contain no-repeat!important}'
def build(src_html, out_base):
    # the logo is embedded once (CSS variable) so each standalone HTML file stays small
    h = src_html.replace('<img src="{{LOGO}}" alt="">', '<i class="lg" role="img" aria-label="Finsang logo"></i>')
    h = h.replace('.brand img', '.brand .lg').replace('.arch img', '.arch .lg').replace('</style>', LOGO_CSS + '</style>', 1)
    with open(os.path.join(HERE, out_base + '.html'), 'w') as f:
        f.write(h)
    pdf = os.path.join(HERE, out_base + '.pdf')
    subprocess.run([CHROME, '--headless', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=20000', f'--print-to-pdf={pdf}',
                    'file://' + os.path.join(HERE, out_base + '.html')], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print('built', out_base + '.html', '+', out_base + '.pdf')

if __name__ == '__main__':
    build(open(os.path.join(HERE, 'src', 'brochure.src.html')).read(), 'Finsang-360-Career-Program')
    build(GUIDE, 'Finsang-360-Program-Guide')
