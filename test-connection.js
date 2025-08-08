import mongoose from 'mongoose';

const uri = 'mongodb+srv://redhamikael:llBKLaUC0c6e0xwf@cluster0.ucwqu2w.mongodb.net/BI11T?retryWrites=true&w=majority';

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB Atlas successfully.');
  return mongoose.connection.close();
})
.catch((err) => {
  console.error('❌ Failed to connect to MongoDB Atlas:', err.message);
});
