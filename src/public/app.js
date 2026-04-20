// ===== State =====
const state = {
  shareId: null,
  sessionData: null,
  selectedMessageId: null
};

// ===== Constants =====
const STAGE_ORDER = ['querier', 'router', 'scenario_selector', 'agent', 'generator', 'questioner'];
const MAX_TREE_DEPTH = 4;
const MAX_STRING_LENGTH = 300;

// ===== DOM Elements =====
const landingEl = document.getElementById('landing');
const sessionEl = document.getElementById('session');
const landingForm = document.getElementById('landing-form');
const shareIdInput = document.getElementById('share-id-input');
const landingError = document.getElementById('landing-error');
const headerShareId = document.getElementById('header-share-id');
const headerSessionId = document.getElementById('header-session-id');
const loadingEl = document.getElementById('loading');
const sessionError = document.getElementById('session-error');
const timeline = document.getElementById('timeline');

// ===== Initialization =====
function init() {
  landingForm.addEventListener('submit', handleLandingSubmit);
  shareIdInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLandingSubmit(new Event('submit'));
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const hashShareId = window.location.hash.slice(1);
  const shareId = urlParams.get('share_id') || hashShareId;

  if (shareId) {
    shareIdInput.value = shareId;
    loadSession(shareId);
  }
}

// ===== Event Handlers =====
async function handleLandingSubmit(e) {
  e.preventDefault();
  const shareId = shareIdInput.value.trim();
  if (!shareId) {
    showLandingError('Please enter a share ID');
    return;
  }
  await loadSession(shareId);
}

async function loadSession(shareId) {
  showLandingError('');
  showLoading(true);

  try {
    const data = await fetchSession(shareId);
    state.shareId = shareId;
    state.sessionData = data;
    showSessionView(data);
  } catch (err) {
    showLandingError(err.message || 'Failed to load session');
    showLoading(false);
  }
}

function showMessageClick(messageId) {
  state.selectedMessageId = messageId;
  renderTimeline();
}

// ===== API =====
async function fetchSession(shareId) {
  const url = `/api/session?share_id=${encodeURIComponent(shareId)}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Session not found');
    }
    throw new Error(`Server error: ${res.status}`);
  }
  return await res.json();
}

// ===== View Management =====
function showSessionView(data) {
  landingEl.classList.add('hidden');
  sessionEl.classList.remove('hidden');
  showLoading(false);

  headerShareId.textContent = data.share_id;
  headerSessionId.textContent = data.session_id;

  renderTimeline();
}

function showLoading(show) {
  if (show) {
    loadingEl.classList.remove('hidden');
  } else {
    loadingEl.classList.add('hidden');
  }
}

function showLandingError(msg) {
  landingError.textContent = msg;
}

// ===== Timeline Rendering =====
function renderTimeline() {
  timeline.innerHTML = '';

  if (!state.sessionData || !state.sessionData.messages) {
    timeline.innerHTML = '<div class="trace-empty">No messages found</div>';
    return;
  }

  const messages = state.sessionData.messages;
  const traces = state.sessionData.traces || [];
  const tracesMap = new Map(traces.map(t => [t.id, t]));

  messages.forEach((msg, index) => {
    const msgEl = createMessageElement(msg, tracesMap.get(msg.id), index);
    timeline.appendChild(msgEl);
  });
}

function createMessageElement(message, trace, index) {
  const card = document.createElement('div');
  card.className = 'message-card';
  card.dataset.type = message.type;
  card.dataset.id = message.id;

  if (state.selectedMessageId === message.id) {
    card.classList.add('selected');
  }

  const header = document.createElement('div');
  header.className = 'message-header';

  const badge = document.createElement('span');
  badge.className = 'message-type-badge';
  badge.textContent = message.type;

  const timestamp = document.createElement('span');
  timestamp.className = 'message-timestamp';
  timestamp.textContent = message.created_at ? formatTimestamp(message.created_at) : `#${index + 1}`;

  header.appendChild(badge);
  header.appendChild(timestamp);

  const text = document.createElement('div');
  text.className = 'message-text';
  text.textContent = message.text || '';

  if (message.text && message.text.length > 200) {
    text.classList.add('collapsed');
    const expandBtn = document.createElement('button');
    expandBtn.className = 'json-tree-toggle';
    expandBtn.textContent = 'Show more';
    expandBtn.onclick = (e) => {
      e.stopPropagation();
      text.classList.toggle('expanded');
      expandBtn.textContent = text.classList.contains('expanded') ? 'Show less' : 'Show more';
    };
  }

  card.appendChild(header);
  card.appendChild(text);

  if (trace) {
    const tracePanel = createTracePanel(trace);
    card.appendChild(tracePanel);
  } else {
    const emptyTrace = document.createElement('div');
    emptyTrace.className = 'trace-empty';
    emptyTrace.textContent = 'No trace data available';
    card.appendChild(emptyTrace);
  }

  card.addEventListener('click', () => showMessageClick(message.id));

  return card;
}

function formatTimestamp(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString();
  } catch {
    return '';
  }
}

// ===== Trace Panel Rendering =====
function createTracePanel(trace) {
  const panel = document.createElement('div');
  panel.className = 'trace-panel';

  const stages = trace.stages || {};
  const stat = trace.stat || {};

  const activeStages = STAGE_ORDER.filter(name => stages[name] !== null);
  const hasActiveStages = activeStages.length > 0;

  if (hasActiveStages) {
    const pipelinePath = createPipelinePath(activeStages);
    panel.appendChild(pipelinePath);
  }

  if (stat && Object.keys(stat).length > 0) {
    const timingBars = createTimingBars(stat);
    panel.appendChild(timingBars);
  }

  activeStages.forEach(stageName => {
    const stageData = stages[stageName];
    if (stageData) {
      const stageSection = createStageSection(stageName, stageData);
      panel.appendChild(stageSection);
    }
  });

  return panel;
}

function createPipelinePath(activeStages) {
  const container = document.createElement('div');
  container.className = 'pipeline-path';

  STAGE_ORDER.forEach((stageName, index) => {
    const isActive = activeStages.includes(stageName);
    const pill = document.createElement('span');
    pill.className = `pipeline-pill${isActive ? ' active' : ''}`;
    pill.textContent = formatStageName(stageName);
    container.appendChild(pill);

    if (index < STAGE_ORDER.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'pipeline-pill-arrow';
      arrow.textContent = '→';
      container.appendChild(arrow);
    }
  });

  return container;
}

function formatStageName(name) {
  return name.replace(/_/g, ' ');
}

function createTimingBars(stat) {
  const container = document.createElement('div');
  container.className = 'timing-bars';

  const total = Object.values(stat).reduce((sum, val) => sum + (val || 0), 0);
  const entries = Object.entries(stat).filter(([_, val]) => val !== null);

  entries.forEach(([key, value]) => {
    const row = document.createElement('div');
    row.className = 'timing-row';

    const label = document.createElement('div');
    label.className = 'timing-label';
    label.textContent = formatStageName(key);
    label.title = key;

    const track = document.createElement('div');
    track.className = 'timing-bar-track';

    const fill = document.createElement('div');
    fill.className = 'timing-bar-fill';
    const percentage = total > 0 ? (value / total) * 100 : 0;
    fill.style.width = `${percentage}%`;

    track.appendChild(fill);

    const valueText = document.createElement('div');
    valueText.className = 'timing-value';
    valueText.textContent = `${Math.round(value)}ms`;

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(valueText);
    container.appendChild(row);
  });

  return container;
}

// ===== Stage Section Rendering =====
function createStageSection(stageName, stageData) {
  const section = document.createElement('div');
  section.className = 'stage-section';

  const header = document.createElement('div');
  header.className = 'stage-header';

  const arrow = document.createElement('span');
  arrow.className = 'stage-arrow open';
  arrow.textContent = '▶';

  const name = document.createElement('span');
  name.className = 'stage-name';
  name.textContent = formatStageName(stageName);

  header.appendChild(arrow);
  header.appendChild(name);

  const body = document.createElement('div');
  body.className = 'stage-body';

  if (stageData.error) {
    const error = document.createElement('div');
    error.className = 'summary-error';
    error.textContent = stageData.error;
    body.appendChild(error);
  }

  if (stageData.summary && Object.keys(stageData.summary).length > 0) {
    const summaryGrid = createSummaryGrid(stageData.summary);
    body.appendChild(summaryGrid);
  }

  const jsonToggle = document.createElement('button');
  jsonToggle.className = 'json-tree-toggle';
  jsonToggle.textContent = 'Show raw JSON';

  const jsonTree = document.createElement('div');
  jsonTree.className = 'json-tree hidden';
  renderJsonTree(stageData.raw, jsonTree, 0);

  jsonToggle.addEventListener('click', () => {
    jsonTree.classList.toggle('hidden');
    jsonToggle.textContent = jsonTree.classList.contains('hidden') ? 'Show raw JSON' : 'Hide raw JSON';
  });

  body.appendChild(jsonToggle);
  body.appendChild(jsonTree);

  header.addEventListener('click', () => {
    body.classList.toggle('collapsed');
    arrow.classList.toggle('open');
  });

  section.appendChild(header);
  section.appendChild(body);

  return section;
}

// ===== Summary Grid Rendering =====
function createSummaryGrid(summary) {
  const grid = document.createElement('div');
  grid.className = 'summary-grid';

  Object.entries(summary).forEach(([key, value]) => {
    const row = document.createElement('div');
    row.className = 'summary-row';

    const keyEl = document.createElement('div');
    keyEl.className = 'summary-key';
    keyEl.textContent = formatSummaryKey(key);

    const valueEl = document.createElement('div');
    valueEl.className = 'summary-value';
    valueEl.textContent = formatSummaryValue(value);
    valueEl.title = String(value);

    row.appendChild(keyEl);
    row.appendChild(valueEl);
    grid.appendChild(row);
  });

  return grid;
}

function formatSummaryKey(key) {
  return key.replace(/_/g, ' ');
}

function formatSummaryValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  const str = String(value);
  if (str.length > 100) {
    return str.slice(0, 100) + '...';
  }
  return str;
}

// ===== JSON Tree Rendering =====
function renderJsonTree(data, container, depth) {
  container.innerHTML = '';

  if (depth > MAX_TREE_DEPTH) {
    container.textContent = '... (depth limit reached)';
    return;
  }

  const fragment = createJsonNode(data, depth);
  container.appendChild(fragment);

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('json-toggle')) {
      const parent = e.target.parentElement;
      const children = parent.querySelector('.json-children');
      if (children) {
        children.classList.toggle('hidden');
        e.target.textContent = children.classList.contains('hidden') ? '▶' : '▼';
      }
    }
  });
}

function createJsonNode(data, depth) {
  const fragment = document.createDocumentFragment();

  if (data === null) {
    const span = document.createElement('span');
    span.className = 'json-null';
    span.textContent = 'null';
    fragment.appendChild(span);
    return fragment;
  }

  const type = getType(data);

  switch (type) {
    case 'object': {
      const entries = Object.entries(data);
      if (entries.length === 0) {
        const span = document.createElement('span');
        span.className = 'json-bracket';
        span.textContent = '{}';
        fragment.appendChild(span);
        return fragment;
      }

      const toggle = document.createElement('span');
      toggle.className = 'json-toggle';
      toggle.textContent = '▼';
      fragment.appendChild(toggle);

      const open = document.createElement('span');
      open.className = 'json-bracket';
      open.textContent = '{';
      fragment.appendChild(open);

      const children = document.createElement('div');
      children.className = 'json-children';

      entries.forEach(([key, value], index) => {
        const node = document.createElement('div');
        node.className = 'json-node';

        const keySpan = document.createElement('span');
        keySpan.className = 'json-key';
        keySpan.textContent = `"${key}": `;
        node.appendChild(keySpan);

        const valueFragment = createJsonNode(value, depth + 1);
        node.appendChild(valueFragment);

        const comma = document.createElement('span');
        comma.className = 'json-bracket';
        comma.textContent = index < entries.length - 1 ? ',' : '';
        node.appendChild(comma);

        children.appendChild(node);
      });

      fragment.appendChild(children);

      const close = document.createElement('span');
      close.className = 'json-bracket';
      close.textContent = '}';
      fragment.appendChild(close);

      break;
    }

    case 'array': {
      if (data.length === 0) {
        const span = document.createElement('span');
        span.className = 'json-bracket';
        span.textContent = '[]';
        fragment.appendChild(span);
        return fragment;
      }

      const toggle = document.createElement('span');
      toggle.className = 'json-toggle';
      toggle.textContent = '▼';
      fragment.appendChild(toggle);

      const open = document.createElement('span');
      open.className = 'json-bracket';
      open.textContent = '[';
      fragment.appendChild(open);

      const children = document.createElement('div');
      children.className = 'json-children';

      data.forEach((value, index) => {
        const node = document.createElement('div');
        node.className = 'json-node';

        const valueFragment = createJsonNode(value, depth + 1);
        node.appendChild(valueFragment);

        const comma = document.createElement('span');
        comma.className = 'json-bracket';
        comma.textContent = index < data.length - 1 ? ',' : '';
        node.appendChild(comma);

        children.appendChild(node);
      });

      fragment.appendChild(children);

      const close = document.createElement('span');
      close.className = 'json-bracket';
      close.textContent = ']';
      fragment.appendChild(close);

      break;
    }

    case 'string': {
      const span = document.createElement('span');
      span.className = 'json-string';
      const str = String(data);

      if (str.length > MAX_STRING_LENGTH) {
        const truncated = str.slice(0, MAX_STRING_LENGTH) + '...';
        span.textContent = `"${truncated}"`;
        span.title = str;
        span.style.cursor = 'pointer';
        span.addEventListener('click', () => {
          span.textContent = `"${str}"`;
          span.style.cursor = 'default';
        });
      } else {
        span.textContent = `"${str}"`;
      }

      fragment.appendChild(span);
      break;
    }

    case 'number': {
      const span = document.createElement('span');
      span.className = 'json-number';
      span.textContent = String(data);
      fragment.appendChild(span);
      break;
    }

    case 'boolean': {
      const span = document.createElement('span');
      span.className = 'json-boolean';
      span.textContent = String(data);
      fragment.appendChild(span);
      break;
    }
  }

  return fragment;
}

function getType(value) {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

// ===== Start =====
init();
