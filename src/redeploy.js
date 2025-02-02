require('dotenv').config();
const redeploy = require('./lib/redeployFunctions');

// Run the redeployment if this script is executed directly
if (require.main === module) {
  redeploy()
    .then((result) => {
      console.log('\nRedeployment successful!');
      console.log('Functions domain:', result.domain);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nRedeployment failed. See error details above.');
      process.exit(1);
    });
}

module.exports = redeploy; 