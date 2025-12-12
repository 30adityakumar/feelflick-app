const Logger = require('./utils/logger');

const logger = new Logger('test.log');

console.log('\n🧪 Testing Logger Module...\n');

logger.section('TESTING LOGGER');
logger.info('This is an info message');
logger.success('This is a success message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message');

logger.section('TESTING LOG FILE');
logger.info('Log file path: ' + logger.getLogFilePath());

console.log('\n✅ Logger test complete!');
console.log('Check logs/test-*.log for output\n');
