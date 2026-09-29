// Reads the bank/Opay details from the environment each time it's called,
// so editing .env and restarting the server is all that's needed to update them.
function getPaymentInfo() {
  return {
    bankName: process.env.BANK_NAME,
    bankAccountName: process.env.BANK_ACCOUNT_NAME,
    bankAccountNumber: process.env.BANK_ACCOUNT_NUMBER,
    opayAccountName: process.env.OPAY_ACCOUNT_NAME,
    opayAccountNumber: process.env.OPAY_ACCOUNT_NUMBER
  };
}

module.exports = getPaymentInfo;