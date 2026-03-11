class State {
  constructor(initialState = {}) {
    this._state = initialState;
    this._listeners = new Set();
    this._notifyScheduled = false;
  }

  get() { return this._state; }

  getProp(key) { return this._state[key]; }

  set(updates) {
    const newState = typeof updates === 'function'
      ? updates(this._state)
      : { ...this._state, ...updates };
    this._state = newState;
    this._notify();
  }

  setProp(key, value) {
    this._state[key] = value;
    this._notify();
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  _notify() {
    if (this._notifyScheduled) return;
    this._notifyScheduled = true;
    requestAnimationFrame(() => {
      this._notifyScheduled = false;
      this._listeners.forEach(listener => {
        try {
          listener(this._state);
        } catch (e) {
          console.error('State listener error:', e);
        }
      });
    });
  }

  _notifySync() {
    this._listeners.forEach(listener => {
      try { listener(this._state); }
      catch (e) { console.error('State listener error:', e); }
    });
  }

  reset(initialState = {}) {
    this._state = initialState;
    this._notify();
  }
}

module.exports = { State };
