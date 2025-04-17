import debugFactory from 'debug';

// Create a single app-wide debug factory
const DEBUG = debugFactory('*');

// Export the debug factory for use across the application
export default DEBUG; 