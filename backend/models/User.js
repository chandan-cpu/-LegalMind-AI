const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 1. User ka schema design karna
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ek email se bas ek hi account banega
    },
    password: {
        type: String,
        required: true,
    }
}, {
    timestamps: true // Ye automatically account banne ki date save kar lega
});

// 2. Security: Save karne se pehle password ko encrypt (hash) karna
userSchema.pre('save', async function(next) {
    // Agar password change nahi hua hai to seedha aage badho
    if (!this.isModified('password')) {
        next();
    }
    // Password ko bcrypt se hash (scramble) kar do taaki koi database hack bhi kare to password na dikhe
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// 3. Login ke time check karna ki password map ho raha hai ya nahi
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// 4. Model ko export karna
const User = mongoose.model('User', userSchema);
module.exports = User;
