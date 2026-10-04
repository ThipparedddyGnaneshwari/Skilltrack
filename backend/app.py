import os, random
from datetime import date, datetime, timedelta
from functools import wraps
from dotenv import load_dotenv
from flask import Flask, jsonify, request, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from itsdangerous import URLSafeTimedSerializer, BadSignature
from werkzeug.security import generate_password_hash, check_password_hash
from ml.risk import risk_scores

load_dotenv()
BASE = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///skilloutcomes.db")
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])
db = SQLAlchemy(app)
tok = URLSafeTimedSerializer(app.config["SECRET_KEY"])

# ---------------- models (swap DATABASE_URL for Postgres/Supabase later) ----------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String, unique=True); pw = db.Column(db.String)
    role = db.Column(db.String); ref_id = db.Column(db.Integer)
class Provider(db.Model):
    id = db.Column(db.Integer, primary_key=True); name = db.Column(db.String); district = db.Column(db.String)
class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True); name = db.Column(db.String)
class Employer(db.Model):
    id = db.Column(db.Integer, primary_key=True); name = db.Column(db.String)
class Trainee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String); phone = db.Column(db.String); district = db.Column(db.String)
    gender = db.Column(db.String); age = db.Column(db.Integer)
    provider_id = db.Column(db.Integer); course_id = db.Column(db.Integer)
    attendance = db.Column(db.Integer); assessment = db.Column(db.Integer)
    certified = db.Column(db.Boolean); experience = db.Column(db.Boolean); duration = db.Column(db.Integer)
    followup_resp = db.Column(db.Integer); status = db.Column(db.String); salary = db.Column(db.Integer)
    gap = db.Column(db.String); completed = db.Column(db.Boolean); retained = db.Column(db.Boolean)
    consent_at = db.Column(db.String); completion = db.Column(db.Date)
class Placement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    trainee_id = db.Column(db.Integer); employer_id = db.Column(db.Integer)
    title = db.Column(db.String); salary = db.Column(db.Integer); join_date = db.Column(db.Date)
    status = db.Column(db.String, default="pending")  # pending|verified|rejected|correction

def d(o):
    return {c.name: (getattr(o, c.name).isoformat() if hasattr(getattr(o, c.name), "isoformat") else getattr(o, c.name))
            for c in o.__table__.columns if c.name != "pw"}

DISTRICTS = {"Pune": (18.52, 73.86), "Mumbai": (19.07, 72.88), "Nagpur": (21.15, 79.09), "Nashik": (20.0, 73.79),
    "Chhatrapati Sambhajinagar": (19.88, 75.34), "Kolhapur": (16.7, 74.24), "Thane": (19.2, 72.97), "Solapur": (17.66, 75.91),
    "Satara": (17.68, 74.0), "Sangli": (16.85, 74.56), "Ahilyanagar": (19.09, 74.74), "Amravati": (20.93, 77.75),
    "Nanded": (19.15, 77.32), "Jalgaon": (21.0, 75.56), "Ratnagiri": (16.99, 73.3)}
GAPS = ["Communication", "Technical skills", "Digital literacy", "Industry knowledge", "Problem solving", "Soft skills"]
REC = {"Communication": "Communication & Interview Skills Training", "Technical skills": "Advanced hands-on technical module",
    "Digital literacy": "Digital Literacy & Advanced Excel bootcamp", "Industry knowledge": "Industry exposure visits and apprenticeships",
    "Problem solving": "Case-based problem solving workshops", "Soft skills": "Workplace readiness and soft-skills programme"}
PROVIDERS = ["Maharashtra Skill Development Centre", "Pune Digital Skills Academy", "Nagpur Technical Training Institute",
    "Nashik Employment Skills Centre", "Mumbai Future Skills Academy", "Kolhapur Industrial Training Hub", "Thane Vocational Institute",
    "Aurangabad Skills Foundation", "Solapur Livelihood Academy", "Amravati Career Institute"]
COURSES = [("Full Stack Development", 28000), ("Data Analytics", 26000), ("Digital Marketing", 20000), ("Electrician", 17000),
    ("CNC Machine Operator", 19000), ("Healthcare Assistant", 16000), ("Retail Sales", 14000), ("Automotive Technician", 18000),
    ("Hospitality Assistant", 15000), ("Solar Technician", 18500)]
FIRST = ["Aarav", "Sneha", "Rahul", "Priya", "Aditya", "Pooja", "Omkar", "Neha", "Vikram", "Anjali", "Sagar", "Kavita", "Rohan", "Shruti", "Nikhil"]
LAST = ["Patil", "Deshmukh", "Jadhav", "Kulkarni", "Shinde", "Pawar", "More", "Gaikwad", "Joshi", "Bhosale", "Chavan", "Kale"]
EMPLOYERS = ["ABC Technologies", "Tata Motors Vendor Park", "Bajaj Auto Ancillary", "Reliance Retail Outlet", "Apollo Clinic", "Infosys BPM",
    "Mahindra Logistics", "Fortis Care", "Kirloskar Systems", "Godrej Interio", "Sahyadri Solar", "Hotel Deccan Residency", "Wipro Services",
    "Cipla Healthcare", "Ashok Leyland Dealer", "DMart Store", "Zensar Digital", "Persistent Systems", "Medplus Pharmacy", "Pune Auto Works"]

def seed():
    if User.query.first(): return
    random.seed(7)
    db.session.add(User(email="admin@skillmaharashtra.gov.in", pw=generate_password_hash("admin123"), role="admin", ref_id=0))
    for n in PROVIDERS: db.session.add(Provider(name=n, district=random.choice(list(DISTRICTS))))
    for n, _ in COURSES: db.session.add(Course(name=n))
    for n in EMPLOYERS: db.session.add(Employer(name=n))
    db.session.commit()
    db.session.add(User(email="employer@demo.com", pw=generate_password_hash("employer123"), role="employer", ref_id=1))
    for i in range(1, 181):
        ci = random.randrange(len(COURSES))
        att, ass = random.randint(45, 100), random.randint(30, 98)
        done = att >= 55
        r, st = random.random(), "Unemployed"
        if done:
            p = 0.3 + ass / 190
            st = ("Employed" if r < p else "Self-employed" if r < p + .07 else "Apprenticeship" if r < p + .15
                  else "Further education" if r < p + .19 else "Unemployed")
        comp = date(random.choice([2023, 2024, 2025, 2026]), random.randint(1, 12), random.randint(1, 28))
        name = "Aarav Patil" if i == 1 else f"{random.choice(FIRST)} {random.choice(LAST)}"
        if i == 1: att, ass, done, st, ci = 88, 81, True, "Employed", 0
        t = Trainee(id=i, name=name, phone=f"98{random.randint(10000000, 99999999)}", district=random.choice(list(DISTRICTS)),
            gender=random.choice(["Male", "Female"]), age=random.randint(18, 35), provider_id=random.randint(1, 10), course_id=ci + 1,
            attendance=att, assessment=ass, certified=ass >= 50 and att >= 60, experience=random.random() < .3,
            duration=random.choice([90, 120, 180]), followup_resp=random.randint(20, 100), status=st,
            salary=int(COURSES[ci][1] * random.uniform(.8, 1.3)) if st in ("Employed", "Self-employed", "Apprenticeship") else 0,
            gap=random.choices(GAPS, [30, 18, 20, 12, 10, 10])[0], completed=done, retained=random.random() < .8,
            consent_at=datetime.now().isoformat() if i % 5 else None, completion=comp)
        db.session.add(t)
        if st == "Employed":
            db.session.add(Placement(trainee_id=i, employer_id=1 if i == 1 else random.randint(1, 20),
                title="Junior Web Developer" if i == 1 else random.choice(["Associate", "Technician", "Executive", "Trainee Operator"]),
                salary=25000 if i == 1 else t.salary, join_date=date(2026, 8, 12) if i == 1 else comp + timedelta(days=45),
                status="pending" if i == 1 else random.choices(["verified", "pending", "rejected"], [75, 20, 5])[0]))
    db.session.add(User(email="trainee@demo.com", pw=generate_password_hash("trainee123"), role="trainee", ref_id=1))
    t1 = db.session.get(Trainee, 1); t1.consent_at = datetime.now().isoformat(); t1.gap = "Communication"
    db.session.commit()

# ---------------- auth ----------------
def auth(*roles):
    def deco(f):
        @wraps(f)
        def w(*a, **k):
            h = request.headers.get("Authorization", "").replace("Bearer ", "")
            try: g.user = tok.loads(h, max_age=86400)
            except BadSignature: return jsonify(error="Please sign in again."), 401
            if roles and g.user["role"] not in roles: return jsonify(error="You do not have access to this resource."), 403
            return f(*a, **k)
        return w
    return deco

@app.post("/api/auth/login")
def login():
    b = request.get_json(silent=True) or {}
    u = User.query.filter_by(email=str(b.get("email", "")).strip().lower()).first()
    if not u or not check_password_hash(u.pw, str(b.get("password", ""))): return jsonify(error="Invalid email or password."), 401
    return jsonify(session_of(u))

def session_of(u):
    name = "Government Admin"
    if u.role == "trainee": name = db.session.get(Trainee, u.ref_id).name
    if u.role == "employer": name = db.session.get(Employer, u.ref_id).name
    return {"token": tok.dumps({"id": u.id, "role": u.role, "ref": u.ref_id}), "role": u.role, "email": u.email, "name": name}

@app.post("/api/auth/signup")
def signup():
    import re
    b = request.get_json(silent=True) or {}
    role = b.get("role"); email = str(b.get("email", "")).strip().lower()
    if role not in ("trainee", "employer"): return jsonify(error="Choose Trainee or Employer."), 400
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email): return jsonify(error="Enter a valid email address."), 400
    if len(str(b.get("password", ""))) < 8: return jsonify(error="Password must be at least 8 characters."), 400
    if User.query.filter_by(email=email).first(): return jsonify(error="An account with this email already exists."), 409
    if role == "trainee":
        if not str(b.get("name", "")).strip() or b.get("district") not in DISTRICTS or not b.get("consent"):
            return jsonify(error="Name, district and consent are required."), 400
        try: age = (date.today() - date.fromisoformat(b.get("dob"))).days // 365
        except (TypeError, ValueError): return jsonify(error="Enter a valid date of birth."), 400
        ref = Trainee(name=b["name"].strip(), phone=str(b.get("phone", "")), district=b["district"], gender=b.get("gender", "Other"), age=age,
            provider_id=1, course_id=1, attendance=0, assessment=0, certified=False, experience=False, duration=90, followup_resp=0,
            status="Other", salary=0, gap="Communication", completed=False, retained=False, consent_at=datetime.now().isoformat(), completion=date.today())
    else:
        if not str(b.get("company", "")).strip(): return jsonify(error="Company name is required."), 400
        ref = Employer(name=b["company"].strip())
    db.session.add(ref); db.session.flush()
    u = User(email=email, pw=generate_password_hash(b["password"]), role=role, ref_id=ref.id)
    db.session.add(u); db.session.commit()
    return jsonify({**session_of(u), "accountStatus": "Pending Verification" if role == "employer" else "Active"}), 201

def ensure_demo_users():
    for email, pw, role, ref in [("admin@skilltrack.demo", "Admin@123", "admin", 0), ("trainee@skilltrack.demo", "Trainee@123", "trainee", 1),
                                 ("employer@skilltrack.demo", "Employer@123", "employer", 1)]:
        if not User.query.filter_by(email=email).first(): db.session.add(User(email=email, pw=generate_password_hash(pw), role=role, ref_id=ref))
    db.session.commit()

# ---------------- analytics ----------------
def pct(a, b): return round(100 * a / b, 1) if b else 0
def avg(xs): xs = list(xs); return round(sum(xs) / len(xs)) if xs else 0

def group(ts, key, label):
    out = []
    for k in sorted({key(t) for t in ts}):
        s = [t for t in ts if key(t) == k]; c = [t for t in s if t.completed]
        emp = [t for t in c if t.status == "Employed"]
        out.append({label: k, "trainees": len(s), "completion": pct(len(c), len(s)), "placement": pct(len(emp), len(c)),
            "employment": pct(len([t for t in c if t.status in ("Employed", "Self-employed", "Apprenticeship")]), len(c)),
            "salary": avg(t.salary for t in emp), "retention": pct(len([t for t in emp if t.retained]), len(emp)),
            "gap": pct(len([t for t in s if t.assessment < 55]), len(s))})
    return out

def filtered():
    q = Trainee.query
    for f in ("district", "gender", "status"):
        if request.args.get(f): q = q.filter(getattr(Trainee, f) == request.args[f])
    if request.args.get("course_id"): q = q.filter_by(course_id=int(request.args["course_id"]))
    if request.args.get("provider_id"): q = q.filter_by(provider_id=int(request.args["provider_id"]))
    return q.all()

@app.get("/api/analytics/overview")
@auth("admin")
def overview():
    ts = filtered(); c = [t for t in ts if t.completed]
    emp = [t for t in c if t.status == "Employed"]; pl = Placement.query.all()
    base = avg(t.salary for t in emp)
    stat = {s: len([t for t in c if t.status == s]) for s in ["Employed", "Self-employed", "Apprenticeship", "Unemployed", "Further education"]}
    years = {}
    for t in c: years.setdefault(t.completion.year, []).append(t)
    return jsonify(kpis={"trainees": len(ts), "providers": Provider.query.count(), "courses": Course.query.count(), "placements": len(pl),
        "placementRate": pct(len(emp), len(c)), "employmentRate": pct(sum(stat[s] for s in ("Employed", "Self-employed", "Apprenticeship")), len(c)),
        "selfEmploymentRate": pct(stat["Self-employed"], len(c)), "apprenticeshipRate": pct(stat["Apprenticeship"], len(c)),
        "unemploymentRate": pct(stat["Unemployed"], len(c)), "avgSalary": base, "retentionRate": pct(len([t for t in emp if t.retained]), len(emp)),
        "dropoutRate": pct(len(ts) - len(c), len(ts)), "skillGapRisk": pct(len([t for t in ts if t.assessment < 55]), len(ts)),
        "followupRate": avg(t.followup_resp for t in ts),
        "verificationRate": pct(len([p for p in pl if p.status == "verified"]), len(pl))},
        outcomes=[{"name": k, "value": v} for k, v in stat.items()],
        trend=[{"year": str(y), "placementRate": pct(len([t for t in v if t.status == "Employed"]), len(v))} for y, v in sorted(years.items())],
        salaryProgression=[{"stage": s, "salary": round(base * m)} for s, m in
                           [("Training completion", .85), ("3 months", .95), ("6 months", 1.05), ("12 months", 1.15)]],
        salaryNote="Salary progression is simulated in this prototype (no longitudinal salary history seeded).")

@app.get("/api/analytics/districts")
@auth("admin")
def districts():
    ts = Trainee.query.all()
    return jsonify([{**r, "lat": DISTRICTS[r["district"]][0], "lng": DISTRICTS[r["district"]][1]} for r in group(ts, lambda t: t.district, "district")])

@app.get("/api/analytics/providers")
@auth("admin")
def providers():
    names = {p.id: p.name for p in Provider.query.all()}
    return jsonify([{**r, "provider": names[r["pid"]]} for r in group(Trainee.query.all(), lambda t: t.provider_id, "pid")])

@app.get("/api/analytics/courses")
@auth("admin")
def courses():
    names = {c.id: c.name for c in Course.query.all()}; ts = Trainee.query.all()
    rows = group(ts, lambda t: t.course_id, "cid")
    for r in rows:
        s = [t for t in ts if t.course_id == r["cid"]]
        r.update(course=names[r["cid"]], enrolled=len(s), completed=len([t for t in s if t.completed]),
                 certified=len([t for t in s if t.certified]), placed=len([t for t in s if t.status == "Employed"]))
    return jsonify(rows)

@app.get("/api/skill-gaps")
@auth("admin")
def skills():
    ts = Trainee.query.all(); n = len(ts)
    rows = sorted([{"skill": s, "percent": pct(len([t for t in ts if t.gap == s]), n)} for s in GAPS], key=lambda r: -r["percent"])
    for i, r in enumerate(rows):
        r.update(recommendation=REC[r["skill"]], priority="High" if i < 2 else "Medium" if i < 4 else "Low")
    return jsonify(rows)

@app.get("/api/risk-analysis")
@auth("admin")
def risk():
    ts = Trainee.query.filter_by(completed=True).all(); sc = risk_scores(ts)
    hi = sorted([{**d(t), **sc[t.id]} for t in ts if t.id in sc and sc[t.id]["level"] == "High"], key=lambda r: -r["score"])
    counts = {l: len([1 for v in sc.values() if v["level"] == l]) for l in ("Low", "Medium", "High")}
    return jsonify(counts=counts, highRisk=hi[:15], insight="Communication and interview readiness appear to be the strongest contributors to non-placement. "
        "Recommended action: introduce interview-readiness workshops before placement drives.", disclaimer="Prototype prediction - not a final decision.")

# ---------------- trainees ----------------
def full(t):
    sc = risk_scores(Trainee.query.filter_by(completed=True).all()).get(t.id)
    pls = Placement.query.filter_by(trainee_id=t.id).all(); fu = []
    for m in (3, 6, 12):
        due = t.completion + timedelta(days=30 * m)
        fu.append({"month": m, "due": due.isoformat(), "channel": ["SMS", "WhatsApp", "Email"][m % 3],
                   "status": "Completed" if due < date.today() and t.followup_resp > 60 else "Overdue" if due < date.today()
                   else "Sent" if (due - date.today()).days < 14 else "Pending"})
    return {**d(t), "provider": db.session.get(Provider, t.provider_id).name, "course": db.session.get(Course, t.course_id).name,
            "placements": [d(p) for p in pls], "followups": fu, "risk": sc, "recommendation": REC[t.gap],
            "profileCompletion": 90 if t.consent_at else 70}

@app.get("/api/trainees")
@auth("admin")
def list_trainees():
    q = (request.args.get("q") or "").lower(); pn = {p.id: p.name for p in Provider.query.all()}; cn = {c.id: c.name for c in Course.query.all()}
    pv = {p.trainee_id: p.status for p in Placement.query.all()}
    rows = [{**d(t), "provider": pn[t.provider_id], "course": cn[t.course_id], "verification": pv.get(t.id, "-")} for t in filtered()]
    rows = [r for r in rows if not q or any(q in str(r[k]).lower() for k in ("name", "id", "phone", "district", "course", "provider", "status"))]
    return jsonify(rows[:500])

@app.get("/api/trainees/me")
@auth("trainee")
def me(): return jsonify(full(db.session.get(Trainee, g.user["ref"])))

@app.get("/api/trainees/<int:tid>")
@auth("admin")
def trainee(tid):
    t = db.session.get(Trainee, tid)
    return jsonify(full(t)) if t else (jsonify(error="Trainee not found."), 404)

@app.put("/api/trainees/me/status")
@auth("trainee")
def update_status():
    b = request.get_json(silent=True) or {}; t = db.session.get(Trainee, g.user["ref"])
    if b.get("status") not in ("Employed", "Self-employed", "Apprenticeship", "Unemployed", "Further education", "Other"):
        return jsonify(error="Choose a valid status."), 400
    if b["status"] == "Employed":
        try: sal = int(b.get("salary")); jd = date.fromisoformat(b.get("join_date"))
        except (TypeError, ValueError): return jsonify(error="Enter a valid salary and joining date."), 400
        if not b.get("employer") or not b.get("title"): return jsonify(error="Employer name and job title are required."), 400
        emp = Employer.query.filter_by(name=b["employer"]).first() or Employer(name=b["employer"])
        db.session.add(emp); db.session.flush()
        db.session.add(Placement(trainee_id=t.id, employer_id=emp.id, title=b["title"], salary=sal, join_date=jd, status="pending"))
        t.salary = sal
    t.status = b["status"]; db.session.commit()
    return jsonify(full(t))

@app.post("/api/consent")
@auth("trainee")
def consent():
    if not (request.get_json(silent=True) or {}).get("agree"): return jsonify(error="Consent must be given to continue."), 400
    t = db.session.get(Trainee, g.user["ref"]); t.consent_at = datetime.now().isoformat(); db.session.commit()
    return jsonify(consent_at=t.consent_at)

# ---------------- employer verification ----------------
@app.get("/api/placements")
@auth("employer", "admin")
def placements():
    q = Placement.query
    if g.user["role"] == "employer": q = q.filter_by(employer_id=g.user["ref"])
    out = []
    for p in q.all():
        t = db.session.get(Trainee, p.trainee_id); e = db.session.get(Employer, p.employer_id)
        out.append({**d(p), "candidate": t.name, "company": e.name, "course": db.session.get(Course, t.course_id).name, "gap": t.gap})
    return jsonify(out)

@app.put("/api/placements/<int:pid>/verify")
@auth("employer")
def verify(pid):
    act = (request.get_json(silent=True) or {}).get("action")
    p = db.session.get(Placement, pid)
    if not p or p.employer_id != g.user["ref"]: return jsonify(error="Placement not found."), 404
    if act not in ("verify", "reject", "correction"): return jsonify(error="Invalid action."), 400
    p.status = {"verify": "verified", "reject": "rejected", "correction": "correction"}[act]; db.session.commit()
    return jsonify(d(p))

@app.errorhandler(Exception)
def err(e):
    code = getattr(e, "code", 500)
    return jsonify(error=getattr(e, "description", "Unexpected server error.")), code if isinstance(code, int) else 500

with app.app_context():
    db.create_all(); seed(); ensure_demo_users()

if __name__ == "__main__":
    app.run(port=5000, debug=True)
