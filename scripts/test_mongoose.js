const mongoose = require('mongoose');
const { Schema } = mongoose;

async function test() {
  await mongoose.connect('mongodb://localhost:27017/test_db', { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected');

  const userSchema = new Schema({ balance: { type: Number, default: 0 } });
  const User = mongoose.models.User || mongoose.model('User', userSchema);

  const txSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User' }, amount: Number });
  const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', txSchema);

  const stmtSchema = new Schema({ transaction: { type: Schema.Types.ObjectId, ref: 'Transaction' } });
  const Statement = mongoose.models.Statement || mongoose.model('Statement', stmtSchema);

  const user = await User.create({});
  console.log('User created:', user._id, 'Balance:', user.balance);

  const tx = await Transaction.create({ user: user._id, amount: 100 });
  const stmt = await Statement.create({ transaction: tx._id });

  console.log('Statement created:', stmt._id);
  
  const idStr = tx._id.toString();
  const deleted = await Statement.findOneAndDelete({ transaction: idStr });
  console.log('Deleted statement:', deleted ? deleted._id : 'null');
  
  await User.findByIdAndUpdate(user._id.toString(), { $inc: { balance: 100 } });
  const updatedUser = await User.findById(user._id);
  console.log('Updated user balance:', updatedUser.balance);

  await mongoose.disconnect();
}
test().catch(console.error);
