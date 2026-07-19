/* ─────────────────────────────────────────────
   script.js  —  Intern Feedback Form
   Mock API: https://jsonplaceholder.typicode.com/posts
   Spec: Week 2 · Deimos Web Dev Track
───────────────────────────────────────────── */

'use strict';

// ── DOM References ────────────────────────────────────
const form       = document.getElementById('feedback-form');
const submitBtn  = document.getElementById('submit-btn');
const banner     = document.getElementById('status-banner');
const bannerTitle  = document.getElementById('status-title');
const bannerDetail = document.getElementById('status-detail');
const statusClose  = document.getElementById('status-close');
const charCount  = document.getElementById('char-count');
const charCounter = document.getElementById('char-counter');
const messageTA  = document.getElementById('message');
const refreshBtn = document.getElementById('refresh-btn');
const recentList = document.getElementById('recent-list');

const API_BASE = 'https://crudcrud.com/api/44f7b22440cc42658f929b0bbc6fc5af';
const API_URL  = `${API_BASE}/feedbacks`;

// ── Validation Rules ──────────────────────────────────
const RULES = {
  name: {
    validate: (v) => {
      if (!v.trim()) return 'Full name is required.';
      if (v.trim().length < 3)  return 'Name must be at least 3 characters.';
      if (v.trim().length > 50) return 'Name must be 50 characters or fewer.';
      return null;
    }
  },
  email: {
    validate: (v) => {
      if (!v.trim()) return 'Email address is required.';
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(v.trim())) return 'Please enter a valid email address.';
      return null;
    }
  },
  category: {
    validate: (v) => (!v ? 'Please select a feedback category.' : null)
  },
  rating: {
    validate: () => {
      const checked = form.querySelector('input[name="rating"]:checked');
      return checked ? null : 'Please rate your week (1–5).';
    }
  },
  message: {
    validate: (v) => {
      if (!v.trim()) return 'A message is required.';
      if (v.trim().length < 10)  return 'Message must be at least 10 characters.';
      if (v.trim().length > 500) return 'Message must be 500 characters or fewer.';
      return null;
    }
  }
};

// ── Helper: show / clear field error ─────────────────
function setFieldError(fieldId, message) {
  const group  = document.getElementById(`group-${fieldId}`);
  const errEl  = document.getElementById(`${fieldId}-error`);
  const inputs = group ? group.querySelectorAll('.form-input, input[name="rating"]') : [];

  if (errEl) errEl.textContent = message || '';

  inputs.forEach((input) => {
    if (message) {
      input.classList.add('invalid');
      input.classList.remove('valid');
    } else {
      input.classList.remove('invalid');
      if (fieldId !== 'rating') input.classList.add('valid');
    }
  });
}

// ── Helper: validate a single field ──────────────────
function validateField(fieldId, value) {
  const rule = RULES[fieldId];
  if (!rule) return true;
  const error = rule.validate(value);
  setFieldError(fieldId, error);
  return !error;
}

// ── Validate entire form, return true if all pass ────
function validateForm() {
  let valid = true;
  const nameVal     = document.getElementById('name').value;
  const emailVal    = document.getElementById('email').value;
  const categoryVal = document.getElementById('category').value;
  const messageVal  = messageTA.value;

  if (!validateField('name',     nameVal))     valid = false;
  if (!validateField('email',    emailVal))    valid = false;
  if (!validateField('category', categoryVal)) valid = false;
  if (!validateField('rating',   null))        valid = false;
  if (!validateField('message',  messageVal))  valid = false;

  return valid;
}

// ── Step indicator update ─────────────────────────────
function updateSteps(activeStep) {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`step-${i}`);
    el.classList.remove('active', 'done');
    if (i < activeStep) el.classList.add('done');
    else if (i === activeStep) el.classList.add('active');
  }
}

// ── Status Banner ─────────────────────────────────────
function showBanner(type, title, detail) {
  banner.className  = `status-banner ${type}`;
  bannerTitle.textContent  = title;
  bannerDetail.textContent = detail || '';
  banner.querySelector('.status-icon').textContent = type === 'success' ? '🎉' : '⚠️';
  banner.hidden = false;
  banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideBanner() {
  banner.hidden = true;
  banner.className = 'status-banner';
}

statusClose.addEventListener('click', hideBanner);

// ── Loading state helpers ─────────────────────────────
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle('loading', isLoading);
  submitBtn.setAttribute('aria-busy', isLoading.toString());
}

// ── Character counter ─────────────────────────────────
messageTA.addEventListener('input', () => {
  const len = messageTA.value.length;
  charCount.textContent = len;
  charCounter.classList.remove('near-limit', 'at-limit');
  if (len >= 500)     charCounter.classList.add('at-limit');
  else if (len >= 420) charCounter.classList.add('near-limit');
  // Live validation while typing
  if (messageTA.classList.contains('invalid') || len > 0) {
    validateField('message', messageTA.value);
  }
});

// ── Inline validation on blur ─────────────────────────
document.getElementById('name').addEventListener('blur', (e) => validateField('name', e.target.value));
document.getElementById('email').addEventListener('blur', (e) => validateField('email', e.target.value));
document.getElementById('category').addEventListener('change', (e) => validateField('category', e.target.value));
document.querySelectorAll('input[name="rating"]').forEach((radio) => {
  radio.addEventListener('change', () => validateField('rating', null));
});

// ── Form Submit ───────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault(); // Spec: no page reload

  hideBanner();

  const isValid = validateForm();
  if (!isValid) {
    // Focus first invalid field for accessibility
    const firstError = form.querySelector('.form-input.invalid, input[name="rating"].invalid');
    if (firstError) firstError.focus();
    return;
  }

  // Gather values
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const category = document.getElementById('category').value;
  const rating   = form.querySelector('input[name="rating"]:checked').value;
  const message  = messageTA.value.trim();

  setLoading(true);
  updateSteps(2);

  try {
    // Spec: POST to JSONPlaceholder with correct headers & JSON body
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, category, rating, message })
    });

    // Spec: fetch() does not throw on 4xx/5xx — check response.ok
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const id   = data._id || data.id;

    // Spec: success — show message with ID, reset form
    updateSteps(3);
    showBanner(
      'success',
      `Thanks, ${name}! 🎉`,
      `Your feedback was saved with ID ${id}. The coordinators will review it shortly.`
    );

    form.reset();
    charCount.textContent = '0';
    charCounter.classList.remove('near-limit', 'at-limit');
    form.querySelectorAll('.form-input').forEach((el) => el.classList.remove('valid', 'invalid'));
    updateSteps(1);

    // Refresh recent list to include the new entry
    loadRecentPosts();

  } catch (error) {
    // Spec: error — show friendly message, keep user's input for retry
    updateSteps(1);
    showBanner(
      'error',
      'Submission failed',
      error.message.includes('Failed to fetch')
        ? 'Network error — check your internet connection and try again. Your input has been preserved.'
        : `Something went wrong: ${error.message}. Your input has been preserved.`
    );
  } finally {
    setLoading(false);
  }
});

// ── Bonus: Fetch & Render Recent Posts ────────────────
async function loadRecentPosts() {
  recentList.innerHTML = `
    <div class="recent-skeleton" aria-label="Loading submissions…">
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
    </div>`;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    let posts = await response.json();

    // Sort by creation order descending, take latest 5
    posts = posts.reverse().slice(0, 5);

    if (!posts.length) {
      recentList.innerHTML = `<p style="color:var(--text-muted);text-align:center;padding:24px 0">No submissions yet. Be the first to submit feedback!</p>`;
      return;
    }

    recentList.innerHTML = '';

    posts.forEach((post, index) => {
      // Build initials from submitter's name
      const initials = (post.name || 'AN')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

      const categoryLabels = {
        general:    'General Feedback',
        bug:        'Bug Report',
        suggestion: 'Suggestion'
      };
      const categoryText = categoryLabels[post.category] || post.category || 'Feedback';
      const ratingStars  = '★'.repeat(Number(post.rating) || 0) + '☆'.repeat(5 - (Number(post.rating) || 0));
      const shortMsg     = post.message ? escapeHtml(post.message.slice(0, 90)) + (post.message.length > 90 ? '…' : '') : 'No message.';
      const displayId    = post._id ? post._id.slice(-6).toUpperCase() : '------';

      const item = document.createElement('article');
      item.className = 'recent-item';
      item.style.animationDelay = `${index * 60}ms`;
      item.setAttribute('aria-label', `Submission from ${post.name || 'Anonymous'}`);

      item.innerHTML = `
        <div class="recent-avatar" aria-hidden="true">${initials}</div>
        <div class="recent-body">
          <p class="recent-title">${escapeHtml(post.name || 'Anonymous')} <span style="color:var(--text-muted);font-weight:400;font-size:0.8rem">· ${escapeHtml(categoryText)}</span></p>
          <p class="recent-meta">${ratingStars} &nbsp;${shortMsg}</p>
        </div>
        <span class="recent-id" aria-label="Submission ID ${displayId}">#${displayId}</span>`;

      recentList.appendChild(item);
    });

  } catch {
    recentList.innerHTML = `
      <div style="text-align:center;padding:24px 0;color:var(--text-muted)">
        <p>Could not load recent submissions.</p>
        <button class="btn btn-ghost" style="margin-top:12px" onclick="loadRecentPosts()">Try again</button>
      </div>`;
  }
}

// ── Refresh button ────────────────────────────────────
refreshBtn.addEventListener('click', () => {
  refreshBtn.classList.add('loading');
  refreshBtn.disabled = true;
  loadRecentPosts().finally(() => {
    refreshBtn.classList.remove('loading');
    refreshBtn.disabled = false;
  });
});

// ── HTML Escape ───────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ──────────────────────────────────────────────
loadRecentPosts();
