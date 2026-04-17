const info = (message) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] [INFO] ${message}`);
};

const warn = (message) => {
    const ts = new Date().toISOString();
    console.warn(`[${ts}] [WARN] ${message}`);
};

const error = (message, err) => {
    const ts = new Date().toISOString();
    console.error(`[${ts}] [ERROR] ${message}`, err ? err.message || err : '');
};

module.exports = {
    info,
    warn,
    error
};
