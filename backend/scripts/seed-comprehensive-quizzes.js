/**
 * Comprehensive Quiz Seeder
 * Creates extensive quizzes for all subjects, grades, and terms
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.VITE_MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

const LessonSchema = new mongoose.Schema({
  title: String,
  subject: String,
  grade: String,
  term: String,
}, { strict: false, timestamps: true });

const QuizSchema = new mongoose.Schema({
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  questions: [{
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, required: true },
  }],
  passingScore: { type: Number, default: 70 },
  timeLimit: { type: Number, default: 600 },
}, { timestamps: true });

const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', QuizSchema);

// Comprehensive quiz question banks
const questionBanks = {
  'Mathematics': {
    'Grade 1': [
      { q: 'What is 5 + 3?', opts: ['6', '7', '8', '9'], correct: 2, exp: '5 + 3 = 8' },
      { q: 'What is 10 - 6?', opts: ['3', '4', '5', '6'], correct: 1, exp: '10 - 6 = 4' },
      { q: 'Which number comes before 10?', opts: ['8', '9', '11', '12'], correct: 1, exp: '9 comes before 10' },
      { q: 'How many sides does a circle have?', opts: ['0', '1', '2', '3'], correct: 0, exp: 'A circle has no sides or infinite sides depending on definition' },
      { q: 'What is 7 + 2?', opts: ['8', '9', '10', '11'], correct: 1, exp: '7 + 2 = 9' },
      { q: 'Which is the largest number?', opts: ['5', '3', '9', '7'], correct: 2, exp: '9 is the largest among these numbers' },
      { q: 'What is 9 - 4?', opts: ['4', '5', '6', '7'], correct: 1, exp: '9 - 4 = 5' },
      { q: 'How many days in one week?', opts: ['5', '6', '7', '8'], correct: 2, exp: 'There are 7 days in a week' },
      { q: 'What is 6 + 4?', opts: ['8', '9', '10', '11'], correct: 2, exp: '6 + 4 = 10' },
      { q: 'Which number is between 4 and 6?', opts: ['3', '5', '7', '8'], correct: 1, exp: '5 is between 4 and 6' },
      { q: 'What is 8 + 1?', opts: ['7', '8', '9', '10'], correct: 2, exp: '8 + 1 = 9' },
      { q: 'What is 12 - 7?', opts: ['4', '5', '6', '7'], correct: 1, exp: '12 - 7 = 5' },
      { q: 'Count: 1, 2, 3, 4, ?', opts: ['3', '4', '5', '6'], correct: 2, exp: 'The next number is 5' },
      { q: 'How many months in one year?', opts: ['10', '11', '12', '13'], correct: 2, exp: 'There are 12 months in a year' },
      { q: 'What is half of 10?', opts: ['4', '5', '6', '7'], correct: 1, exp: 'Half of 10 is 5' }
    ],
    'Grade 2': [
      { q: 'What is 25 + 10?', opts: ['30', '35', '40', '45'], correct: 1, exp: '25 + 10 = 35' },
      { q: 'What is 30 - 15?', opts: ['10', '15', '20', '25'], correct: 1, exp: '30 - 15 = 15' },
      { q: 'What is 5 × 3?', opts: ['10', '12', '15', '20'], correct: 2, exp: '5 × 3 = 15' },
      { q: 'How many minutes in one hour?', opts: ['30', '45', '60', '90'], correct: 2, exp: 'There are 60 minutes in one hour' },
      { q: 'What is 40 + 25?', opts: ['55', '60', '65', '70'], correct: 2, exp: '40 + 25 = 65' },
      { q: 'What is 4 × 5?', opts: ['15', '20', '25', '30'], correct: 1, exp: '4 × 5 = 20' },
      { q: 'What is 50 - 23?', opts: ['25', '27', '29', '31'], correct: 1, exp: '50 - 23 = 27' },
      { q: 'How many hours in one day?', opts: ['12', '20', '24', '30'], correct: 2, exp: 'There are 24 hours in one day' },
      { q: 'What is 3 × 6?', opts: ['15', '18', '21', '24'], correct: 1, exp: '3 × 6 = 18' },
      { q: 'What is 100 - 45?', opts: ['45', '50', '55', '60'], correct: 2, exp: '100 - 45 = 55' },
      { q: 'What is 7 × 4?', opts: ['24', '26', '28', '30'], correct: 2, exp: '7 × 4 = 28' },
      { q: 'What is 35 + 35?', opts: ['60', '65', '70', '75'], correct: 2, exp: '35 + 35 = 70' },
      { q: 'What is 20 ÷ 4?', opts: ['4', '5', '6', '7'], correct: 1, exp: '20 ÷ 4 = 5' },
      { q: 'How many sides does a pentagon have?', opts: ['4', '5', '6', '7'], correct: 1, exp: 'A pentagon has 5 sides' },
      { q: 'What is double of 15?', opts: ['25', '30', '35', '40'], correct: 1, exp: 'Double of 15 is 30' }
    ],
    'Grade 3': [
      { q: 'What is 125 + 75?', opts: ['180', '190', '200', '210'], correct: 2, exp: '125 + 75 = 200' },
      { q: 'What is 12 × 8?', opts: ['88', '92', '96', '100'], correct: 2, exp: '12 × 8 = 96' },
      { q: 'What is 144 ÷ 12?', opts: ['10', '11', '12', '13'], correct: 2, exp: '144 ÷ 12 = 12' },
      { q: 'What is 1/2 + 1/4?', opts: ['1/3', '2/4', '3/4', '1'], correct: 2, exp: '1/2 + 1/4 = 2/4 + 1/4 = 3/4' },
      { q: 'What is the area of a rectangle 5 × 4?', opts: ['9', '18', '20', '40'], correct: 2, exp: 'Area = length × width = 5 × 4 = 20' },
      { q: 'What is 250 - 135?', opts: ['105', '115', '125', '135'], correct: 1, exp: '250 - 135 = 115' },
      { q: 'What is 15 × 6?', opts: ['80', '85', '90', '95'], correct: 2, exp: '15 × 6 = 90' },
      { q: 'How many millimeters in 1 centimeter?', opts: ['5', '10', '100', '1000'], correct: 1, exp: 'There are 10 mm in 1 cm' },
      { q: 'What is 3/4 of 20?', opts: ['12', '15', '18', '20'], correct: 1, exp: '3/4 of 20 = (20 × 3) ÷ 4 = 15' },
      { q: 'What is the perimeter of a square with side 7?', opts: ['21', '24', '28', '35'], correct: 2, exp: 'Perimeter = 4 × side = 4 × 7 = 28' },
      { q: 'What is 20% of 50?', opts: ['5', '10', '15', '20'], correct: 1, exp: '20% of 50 = 50 × 0.2 = 10' },
      { q: 'What is 11 × 11?', opts: ['111', '121', '131', '141'], correct: 1, exp: '11 × 11 = 121' },
      { q: 'How many grams in 1 kilogram?', opts: ['10', '100', '1000', '10000'], correct: 2, exp: 'There are 1000 grams in 1 kilogram' },
      { q: 'What is the sum of angles in a triangle?', opts: ['90°', '180°', '270°', '360°'], correct: 1, exp: 'Sum of angles in a triangle is always 180°' },
      { q: 'What is 13 × 7?', opts: ['81', '84', '91', '94'], correct: 2, exp: '13 × 7 = 91' }
    ],
    'default': [
      { q: 'What is 345 + 678?', opts: ['1013', '1023', '1033', '1043'], correct: 1, exp: '345 + 678 = 1023' },
      { q: 'What is 25 × 16?', opts: ['380', '390', '400', '410'], correct: 2, exp: '25 × 16 = 400' },
      { q: 'What is 625 ÷ 25?', opts: ['20', '25', '30', '35'], correct: 1, exp: '625 ÷ 25 = 25' },
      { q: 'What is 75% of 200?', opts: ['125', '150', '175', '200'], correct: 1, exp: '75% of 200 = 200 × 0.75 = 150' },
      { q: 'What is the LCM of 4 and 6?', opts: ['10', '12', '18', '24'], correct: 1, exp: 'LCM of 4 and 6 is 12' },
      { q: 'What is 2³ (2 cubed)?', opts: ['4', '6', '8', '9'], correct: 2, exp: '2³ = 2 × 2 × 2 = 8' },
      { q: 'What is the square root of 144?', opts: ['10', '11', '12', '13'], correct: 2, exp: '√144 = 12' },
      { q: 'How many sides in a hexagon?', opts: ['5', '6', '7', '8'], correct: 1, exp: 'A hexagon has 6 sides' },
      { q: 'What is 15² (15 squared)?', opts: ['200', '215', '225', '250'], correct: 2, exp: '15² = 15 × 15 = 225' },
      { q: 'What is the circumference formula?', opts: ['πr', '2πr', 'πr²', '2πr²'], correct: 1, exp: 'Circumference = 2πr' },
      { q: 'What is 0.5 + 0.25?', opts: ['0.65', '0.70', '0.75', '0.80'], correct: 2, exp: '0.5 + 0.25 = 0.75' },
      { q: 'What is the HCF of 12 and 18?', opts: ['3', '6', '9', '12'], correct: 1, exp: 'HCF of 12 and 18 is 6' },
      { q: 'How many degrees in a circle?', opts: ['180', '270', '360', '450'], correct: 2, exp: 'A circle has 360 degrees' },
      { q: 'What is 4/5 as a decimal?', opts: ['0.6', '0.7', '0.8', '0.9'], correct: 2, exp: '4/5 = 0.8' },
      { q: 'What is the area of a circle formula?', opts: ['2πr', 'πr²', '2πr²', 'πd'], correct: 1, exp: 'Area = πr²' }
    ]
  },
  'English': {
    'Grade 1': [
      { q: 'What comes before D in the alphabet?', opts: ['B', 'C', 'E', 'F'], correct: 1, exp: 'C comes before D' },
      { q: 'Which of these is NOT a vowel?', opts: ['A', 'B', 'E', 'I'], correct: 1, exp: 'B is not a vowel' },
      { q: 'How many letters in "book"?', opts: ['3', '4', '5', '6'], correct: 1, exp: 'Book has 4 letters: B-O-O-K' },
      { q: 'What is the first letter of "apple"?', opts: ['A', 'P', 'L', 'E'], correct: 0, exp: 'Apple starts with A' },
      { q: 'Which word rhymes with "mat"?', opts: ['bat', 'car', 'sun', 'dog'], correct: 0, exp: 'Bat rhymes with mat' },
      { q: 'What is the opposite of "hot"?', opts: ['warm', 'cold', 'cool', 'heat'], correct: 1, exp: 'Cold is the opposite of hot' },
      { q: 'Which is a fruit?', opts: ['chair', 'orange', 'table', 'book'], correct: 1, exp: 'Orange is a fruit' },
      { q: 'What is the last letter of "pen"?', opts: ['p', 'e', 'n', 'a'], correct: 2, exp: 'Pen ends with N' },
      { q: 'How many vowels in "cat"?', opts: ['0', '1', '2', '3'], correct: 1, exp: 'Cat has 1 vowel (a)' },
      { q: 'Which is an animal?', opts: ['desk', 'lion', 'pen', 'cup'], correct: 1, exp: 'Lion is an animal' },
      { q: 'What sound does "B" make?', opts: ['Aaa', 'Buh', 'Cuh', 'Duh'], correct: 1, exp: 'B makes the "buh" sound' },
      { q: 'Which word starts with "S"?', opts: ['cat', 'dog', 'sun', 'bat'], correct: 2, exp: 'Sun starts with S' },
      { q: 'What is the opposite of "up"?', opts: ['high', 'down', 'top', 'over'], correct: 1, exp: 'Down is the opposite of up' },
      { q: 'How many words: "I like cats"?', opts: ['2', '3', '4', '5'], correct: 1, exp: 'There are 3 words' },
      { q: 'Which letter is a vowel?', opts: ['B', 'C', 'O', 'D'], correct: 2, exp: 'O is a vowel' }
    ],
    'Grade 2': [
      { q: 'What is a sentence?', opts: ['One word', 'Complete thought', 'Question only', 'Letter'], correct: 1, exp: 'A sentence expresses a complete thought' },
      { q: 'What is the plural of "box"?', opts: ['boxs', 'boxes', 'boxies', 'boxen'], correct: 1, exp: 'The plural of box is boxes' },
      { q: 'Which is a verb?', opts: ['happy', 'jump', 'red', 'book'], correct: 1, exp: 'Jump is a verb (action word)' },
      { q: 'What comes at the end of a sentence?', opts: ['comma', 'period', 'nothing', 'space'], correct: 1, exp: 'A period (.) ends a sentence' },
      { q: 'Which word is spelled correctly?', opts: ['freind', 'friend', 'frend', 'friand'], correct: 1, exp: 'Friend is spelled correctly' },
      { q: 'What is an adjective?', opts: ['Action word', 'Naming word', 'Describing word', 'Place'], correct: 2, exp: 'An adjective describes a noun' },
      { q: 'Which is a noun?', opts: ['run', 'quickly', 'dog', 'happy'], correct: 2, exp: 'Dog is a noun (naming word)' },
      { q: 'What is a synonym for "big"?', opts: ['small', 'large', 'tiny', 'short'], correct: 1, exp: 'Large means the same as big' },
      { q: 'Which word is an adverb?', opts: ['cat', 'blue', 'quickly', 'house'], correct: 2, exp: 'Quickly is an adverb (describes how)' },
      { q: 'What is the past tense of "run"?', opts: ['runned', 'ran', 'running', 'runs'], correct: 1, exp: 'The past tense of run is ran' },
      { q: 'Which needs a capital letter?', opts: ['cat', 'monday', 'book', 'tree'], correct: 1, exp: 'Days of the week need capital letters' },
      { q: 'What is an antonym for "day"?', opts: ['sun', 'night', 'light', 'morning'], correct: 1, exp: 'Night is the opposite of day' },
      { q: 'Which sentence is correct?', opts: ['She run fast', 'She runs fast', 'She running fast', 'She runned fast'], correct: 1, exp: '"She runs fast" is grammatically correct' },
      { q: 'What punctuation asks a question?', opts: ['.', '?', '!', ','], correct: 1, exp: 'Question mark (?) asks questions' },
      { q: 'Which word means "not happy"?', opts: ['happy', 'sad', 'glad', 'joyful'], correct: 1, exp: 'Sad means not happy' }
    ],
    'default': [
      { q: 'What is a metaphor?', opts: ['Direct comparison', 'Indirect comparison', 'Question', 'Statement'], correct: 1, exp: 'A metaphor is an indirect comparison' },
      { q: 'What is the subject in "The dog barks"?', opts: ['The', 'dog', 'barks', 'The dog'], correct: 1, exp: 'Dog is the subject (who/what does the action)' },
      { q: 'Which is correct?', opts: ['Their going', 'There going', "They're going", 'Theyre going'], correct: 2, exp: "They're (they are) going is correct" },
      { q: 'What is alliteration?', opts: ['Rhyming words', 'Repeated sounds', 'Big words', 'Short words'], correct: 1, exp: 'Alliteration is repeated consonant sounds' },
      { q: 'What is a prefix?', opts: ['End of word', 'Beginning of word', 'Middle of word', 'Whole word'], correct: 1, exp: 'A prefix is added to the beginning of a word' },
      { q: 'Which is a conjunction?', opts: ['happy', 'and', 'quickly', 'book'], correct: 1, exp: 'And is a conjunction (joining word)' },
      { q: 'What is personification?', opts: ['Describing people', 'Giving human traits to non-humans', 'Being a person', 'Personal story'], correct: 1, exp: 'Personification gives human qualities to things' },
      { q: 'What is a homophone?', opts: ['Same sound', 'Same spelling', 'Same meaning', 'Same letter'], correct: 0, exp: 'Homophones sound the same but have different meanings' },
      { q: 'Which is a preposition?', opts: ['run', 'under', 'happy', 'cat'], correct: 1, exp: 'Under is a preposition (shows position)' },
      { q: 'What is an idiom?', opts: ['Phrase with literal meaning', 'Phrase with figurative meaning', 'Single word', 'Question'], correct: 1, exp: 'An idiom has a figurative, not literal meaning' },
      { q: 'Which shows possession?', opts: ['cats', "cat's", 'cates', 'catses'], correct: 1, exp: "Cat's shows possession (belongs to the cat)" },
      { q: 'What is onomatopoeia?', opts: ['Rhyme', 'Word sounds like its meaning', 'Long word', 'Short word'], correct: 1, exp: 'Onomatopoeia is when a word sounds like what it means' },
      { q: 'What is a complex sentence?', opts: ['One clause', 'Two or more clauses', 'No clauses', 'Question'], correct: 1, exp: 'A complex sentence has multiple clauses' },
      { q: 'Which is a simile?', opts: ['He is a lion', 'Like a lion', 'He roared', 'The lion'], correct: 1, exp: 'A simile uses "like" or "as" to compare' },
      { q: 'What is the root word of "unhappy"?', opts: ['un', 'happy', 'unhappy', 'hap'], correct: 1, exp: 'Happy is the root word' }
    ]
  },
  'Science': {
    'Grade 1': [
      { q: 'Which is NOT a living thing?', opts: ['tree', 'cat', 'rock', 'flower'], correct: 2, exp: 'A rock is not living' },
      { q: 'How many legs does an insect have?', opts: ['4', '6', '8', '10'], correct: 1, exp: 'Insects have 6 legs' },
      { q: 'What do plants need to make food?', opts: ['darkness', 'sunlight', 'rain only', 'soil only'], correct: 1, exp: 'Plants need sunlight for photosynthesis' },
      { q: 'Which animal lives in water?', opts: ['lion', 'fish', 'bird', 'elephant'], correct: 1, exp: 'Fish live in water' },
      { q: 'What gives us light during the day?', opts: ['moon', 'sun', 'stars', 'clouds'], correct: 1, exp: 'The sun gives us light during the day' },
      { q: 'Which sense do you use to taste?', opts: ['eyes', 'nose', 'tongue', 'ears'], correct: 2, exp: 'You taste with your tongue' },
      { q: 'How many seasons are there?', opts: ['2', '3', '4', '5'], correct: 2, exp: 'There are 4 seasons' },
      { q: 'What do bees make?', opts: ['milk', 'honey', 'butter', 'cheese'], correct: 1, exp: 'Bees make honey' },
      { q: 'Which is a mammal?', opts: ['fish', 'bird', 'dog', 'snake'], correct: 2, exp: 'Dogs are mammals' },
      { q: 'What falls from clouds?', opts: ['snow', 'leaves', 'birds', 'balloons'], correct: 0, exp: 'Rain, snow, or hail fall from clouds' },
      { q: 'Which part of plant is underground?', opts: ['leaf', 'root', 'flower', 'fruit'], correct: 1, exp: 'Roots grow underground' },
      { q: 'What color are most plants?', opts: ['red', 'green', 'blue', 'yellow'], correct: 1, exp: 'Most plants are green due to chlorophyll' },
      { q: 'Which needs air to breathe?', opts: ['rock', 'human', 'table', 'book'], correct: 1, exp: 'Humans need air to breathe' },
      { q: 'What is the hardest part of your body?', opts: ['skin', 'teeth', 'hair', 'nails'], correct: 1, exp: 'Teeth are the hardest part' },
      { q: 'Which animal can fly?', opts: ['cow', 'butterfly', 'fish', 'dog'], correct: 1, exp: 'Butterflies can fly' }
    ],
    'Grade 2': [
      { q: 'What are the three states of matter?', opts: ['Hot, cold, warm', 'Solid, liquid, gas', 'Big, small, tiny', 'Hard, soft, rough'], correct: 1, exp: 'Matter exists as solid, liquid, or gas' },
      { q: 'What is the process of water becoming ice?', opts: ['melting', 'freezing', 'boiling', 'evaporating'], correct: 1, exp: 'Freezing is when water becomes ice' },
      { q: 'Which planet is closest to the sun?', opts: ['Earth', 'Mercury', 'Venus', 'Mars'], correct: 1, exp: 'Mercury is closest to the sun' },
      { q: 'What gas do we breathe in?', opts: ['carbon dioxide', 'oxygen', 'nitrogen', 'helium'], correct: 1, exp: 'We breathe in oxygen' },
      { q: 'Which is a renewable resource?', opts: ['coal', 'solar energy', 'oil', 'gas'], correct: 1, exp: 'Solar energy is renewable' },
      { q: 'How many teeth do adults usually have?', opts: ['20', '28', '32', '36'], correct: 2, exp: 'Adults usually have 32 teeth' },
      { q: 'What is the function of the heart?', opts: ['digest food', 'pump blood', 'breathe air', 'think'], correct: 1, exp: 'The heart pumps blood' },
      { q: 'Which is a carnivore?', opts: ['cow', 'lion', 'rabbit', 'deer'], correct: 1, exp: 'Lions are carnivores (eat meat)' },
      { q: 'What is the outer layer of Earth called?', opts: ['core', 'crust', 'mantle', 'surface'], correct: 1, exp: 'The crust is the outer layer' },
      { q: 'Which force pulls things down?', opts: ['magnetism', 'gravity', 'friction', 'wind'], correct: 1, exp: 'Gravity pulls things down' },
      { q: 'What is metamorphosis?', opts: ['sleeping', 'changing form', 'eating', 'flying'], correct: 1, exp: 'Metamorphosis is changing form (like caterpillar to butterfly)' },
      { q: 'Which organ helps you breathe?', opts: ['heart', 'lungs', 'stomach', 'brain'], correct: 1, exp: 'Lungs help you breathe' },
      { q: 'What is photosynthesis?', opts: ['eating', 'plants making food from sunlight', 'breathing', 'sleeping'], correct: 1, exp: 'Photosynthesis is how plants make food using sunlight' },
      { q: 'Which is an amphibian?', opts: ['snake', 'frog', 'fish', 'bird'], correct: 1, exp: 'Frogs are amphibians' },
      { q: 'What is evaporation?', opts: ['water to ice', 'water to vapor', 'ice to water', 'rain falling'], correct: 1, exp: 'Evaporation is water turning to vapor' }
    ],
    'default': [
      { q: 'What is the smallest unit of life?', opts: ['atom', 'cell', 'molecule', 'tissue'], correct: 1, exp: 'The cell is the smallest unit of life' },
      { q: 'What is DNA?', opts: ['Disease', 'Genetic material', 'A vitamin', 'A protein'], correct: 1, exp: 'DNA contains genetic information' },
      { q: 'Which is NOT a type of energy?', opts: ['kinetic', 'potential', 'thermal', 'wooden'], correct: 3, exp: 'Wooden is not a type of energy' },
      { q: 'What is an ecosystem?', opts: ['A type of plant', 'Living and non-living things interacting', 'Only animals', 'Just plants'], correct: 1, exp: 'An ecosystem includes all living and non-living things in an area' },
      { q: 'What is the speed of light?', opts: ['300,000 km/s', '150,000 km/s', '500,000 km/s', '100,000 km/s'], correct: 0, exp: 'Light travels at approximately 300,000 km/s' },
      { q: 'Which blood type is universal donor?', opts: ['A', 'B', 'AB', 'O'], correct: 3, exp: 'O negative is the universal donor' },
      { q: 'What is the powerhouse of the cell?', opts: ['nucleus', 'mitochondria', 'ribosome', 'cytoplasm'], correct: 1, exp: 'Mitochondria produce energy for cells' },
      { q: 'What is Newton\'s First Law?', opts: ['Action-reaction', 'Inertia', 'F=ma', 'Gravity'], correct: 1, exp: 'Newton\'s First Law is about inertia' },
      { q: 'Which element has symbol Fe?', opts: ['Fluorine', 'Iron', 'Francium', 'Fermium'], correct: 1, exp: 'Fe is the symbol for Iron' },
      { q: 'What is the pH of pure water?', opts: ['0', '7', '10', '14'], correct: 1, exp: 'Pure water has a pH of 7 (neutral)' },
      { q: 'What causes day and night?', opts: ['Earth orbiting sun', 'Earth rotating', 'Moon moving', 'Clouds'], correct: 1, exp: 'Earth\'s rotation causes day and night' },
      { q: 'Which is the largest organ?', opts: ['liver', 'skin', 'brain', 'heart'], correct: 1, exp: 'Skin is the largest organ' },
      { q: 'What is the formula for photosynthesis?', opts: ['O2 → CO2', 'CO2 + H2O → glucose + O2', 'H2O → H2 + O2', 'CO2 → C + O2'], correct: 1, exp: 'Photosynthesis: CO2 + H2O + sunlight → glucose + O2' },
      { q: 'Which vitamin comes from sunlight?', opts: ['A', 'B', 'C', 'D'], correct: 3, exp: 'Vitamin D is produced when skin is exposed to sunlight' },
      { q: 'What is the study of fossils called?', opts: ['biology', 'paleontology', 'geology', 'archaeology'], correct: 1, exp: 'Paleontology is the study of fossils' }
    ]
  },
  'Social Studies': {
    'default': [
      { q: 'What are the four cardinal directions?', opts: ['Up, down, left, right', 'North, South, East, West', 'Front, back, side, top', 'In, out, over, under'], correct: 1, exp: 'The cardinal directions are North, South, East, and West' },
      { q: 'What is a community?', opts: ['Just houses', 'People living together in one area', 'Only schools', 'Just shops'], correct: 1, exp: 'A community is people living together in an area' },
      { q: 'Who is a leader in a school?', opts: ['student', 'principal', 'janitor', 'parent'], correct: 1, exp: 'The principal is the school leader' },
      { q: 'What is a tradition?', opts: ['New idea', 'Custom passed down', 'Modern technology', 'Recent event'], correct: 1, exp: 'A tradition is a custom passed down through generations' },
      { q: 'Which is a man-made feature?', opts: ['mountain', 'bridge', 'river', 'forest'], correct: 1, exp: 'A bridge is made by humans' },
      { q: 'What is a citizen?', opts: ['Visitor', 'Member of a country', 'Tourist', 'Stranger'], correct: 1, exp: 'A citizen is a legal member of a country' },
      { q: 'What does a mayor lead?', opts: ['country', 'city or town', 'school', 'hospital'], correct: 1, exp: 'A mayor leads a city or town' },
      { q: 'Which is a natural resource?', opts: ['car', 'forest', 'building', 'computer'], correct: 1, exp: 'Forests are natural resources' },
      { q: 'What is geography?', opts: ['Study of math', 'Study of Earth and its features', 'Study of languages', 'Study of animals'], correct: 1, exp: 'Geography studies Earth and its features' },
      { q: 'What is democracy?', opts: ['Rule by one', 'Rule by the people', 'No rules', 'Rule by few'], correct: 1, exp: 'Democracy is government by the people' },
      { q: 'Which ocean is largest?', opts: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correct: 1, exp: 'The Pacific Ocean is the largest' },
      { q: 'What is culture?', opts: ['Just food', 'Way of life of a group', 'Only language', 'Just clothes'], correct: 1, exp: 'Culture is the complete way of life of a group' },
      { q: 'Who makes laws in a democracy?', opts: ['one king', 'elected representatives', 'no one', 'teachers'], correct: 1, exp: 'Elected representatives make laws in a democracy' },
      { q: 'What is a holiday?', opts: ['School day', 'Special day of celebration', 'Work day', 'Ordinary day'], correct: 1, exp: 'A holiday is a special day of celebration or rest' },
      { q: 'Which is a responsibility of a citizen?', opts: ['ignore laws', 'obey laws', 'avoid voting', 'break rules'], correct: 1, exp: 'Obeying laws is a responsibility of citizens' }
    ]
  },
  'Social and Geography Studies': {
    'default': [
      { q: 'What is latitude?', opts: ['East-West lines', 'North-South lines', 'Diagonal lines', 'Curved lines'], correct: 0, exp: 'Latitude lines run East-West (horizontal)' },
      { q: 'What is the equator?', opts: ['North Pole', '0° latitude line', 'South Pole', 'Prime Meridian'], correct: 1, exp: 'The equator is at 0° latitude' },
      { q: 'How many time zones in the world?', opts: ['12', '24', '36', '48'], correct: 1, exp: 'There are 24 main time zones' },
      { q: 'What is a peninsula?', opts: ['Island', 'Land surrounded by water on 3 sides', 'Mountain', 'Desert'], correct: 1, exp: 'A peninsula is land surrounded by water on three sides' },
      { q: 'Which is the driest continent?', opts: ['Africa', 'Antarctica', 'Asia', 'Australia'], correct: 1, exp: 'Antarctica is the driest continent' },
      { q: 'What causes tides?', opts: ['Sun only', 'Moon's gravity', 'Wind', 'Earth's rotation'], correct: 1, exp: "The moon's gravity causes tides" },
      { q: 'What is GDP?', opts: ['Government Department', 'Gross Domestic Product', 'General Data Protection', 'Global Data Platform'], correct: 1, exp: 'GDP is Gross Domestic Product (economic measure)' },
      { q: 'Which is a renewable energy source?', opts: ['coal', 'wind', 'oil', 'natural gas'], correct: 1, exp: 'Wind is a renewable energy source' },
      { q: 'What is urbanization?', opts: ['Farming', 'Growth of cities', 'Deforestation', 'Mining'], correct: 1, exp: 'Urbanization is the growth of cities' },
      { q: 'Which river is longest?', opts: ['Amazon', 'Nile', 'Mississippi', 'Yangtze'], correct: 1, exp: 'The Nile is generally considered the longest river' },
      { q: 'What is population density?', opts: ['Total people', 'People per area', 'Birth rate', 'Death rate'], correct: 1, exp: 'Population density is people per unit area' },
      { q: 'Which is a developing country indicator?', opts: ['High GDP', 'Low literacy rate', 'Advanced technology', 'Good infrastructure'], correct: 1, exp: 'Low literacy rates often indicate developing countries' },
      { q: 'What is climate change?', opts: ['Weather today', 'Long-term temperature shifts', 'Daily rain', 'Seasonal change'], correct: 1, exp: 'Climate change is long-term shifts in temperatures and weather patterns' },
      { q: 'Which continent has most countries?', opts: ['Asia', 'Africa', 'Europe', 'South America'], correct: 1, exp: 'Africa has the most countries (54)' },
      { q: 'What is globalization?', opts: ['Local trade', 'Worldwide interconnection', 'Isolation', 'Single country'], correct: 1, exp: 'Globalization is increasing worldwide interconnection' }
    ]
  },
  'ICT/Computing Skills': {
    'Grade 1': [
      { q: 'What part of computer shows pictures?', opts: ['keyboard', 'monitor', 'mouse', 'speaker'], correct: 1, exp: 'The monitor displays pictures and text' },
      { q: 'What do you use to move the cursor?', opts: ['keyboard', 'mouse', 'screen', 'printer'], correct: 1, exp: 'A mouse moves the cursor on screen' },
      { q: 'Which key makes capital letters?', opts: ['space', 'shift', 'enter', 'delete'], correct: 1, exp: 'Shift key makes capital letters' },
      { q: 'What prints on paper?', opts: ['monitor', 'printer', 'keyboard', 'mouse'], correct: 1, exp: 'A printer prints on paper' },
      { q: 'Where do you type?', opts: ['monitor', 'keyboard', 'mouse', 'printer'], correct: 1, exp: 'You type on the keyboard' },
      { q: 'What stores computer programs?', opts: ['mouse', 'hard drive', 'keyboard', 'screen'], correct: 1, exp: 'Hard drive stores programs and files' },
      { q: 'Which makes sound?', opts: ['monitor', 'speakers', 'keyboard', 'mouse'], correct: 1, exp: 'Speakers produce sound' },
      { q: 'What connects to internet?', opts: ['printer', 'modem', 'monitor', 'keyboard'], correct: 1, exp: 'A modem connects to the internet' },
      { q: 'What is an icon?', opts: ['Letter', 'Small picture', 'Big word', 'Color'], correct: 1, exp: 'An icon is a small picture representing a program' },
      { q: 'Which key goes to new line?', opts: ['space', 'enter', 'shift', 'tab'], correct: 1, exp: 'Enter key moves to a new line' },
      { q: 'What is a folder?', opts: ['File', 'Place to organize files', 'Program', 'Game'], correct: 1, exp: 'A folder organizes and stores files' },
      { q: 'What removes mistakes?', opts: ['enter', 'delete', 'shift', 'space'], correct: 1, exp: 'Delete key removes text' },
      { q: 'What is software?', opts: ['Mouse', 'Programs', 'Screen', 'Keyboard'], correct: 1, exp: 'Software means computer programs' },
      { q: 'Which is an input device?', opts: ['printer', 'keyboard', 'speaker', 'monitor'], correct: 1, exp: 'Keyboard is an input device' },
      { q: 'What is hardware?', opts: ['Programs', 'Physical parts of computer', 'Internet', 'Websites'], correct: 1, exp: 'Hardware is the physical parts you can touch' }
    ],
    'default': [
      { q: 'What does USB stand for?', opts: ['Universal Serial Bus', 'United System Board', 'Universal System Bus', 'United Serial Board'], correct: 0, exp: 'USB stands for Universal Serial Bus' },
      { q: 'What is an algorithm?', opts: ['Computer part', 'Step-by-step instructions', 'Website', 'Program'], correct: 1, exp: 'An algorithm is a step-by-step procedure to solve a problem' },
      { q: 'What does AI stand for?', opts: ['Automatic Input', 'Artificial Intelligence', 'Advanced Internet', 'Application Interface'], correct: 1, exp: 'AI stands for Artificial Intelligence' },
      { q: 'What is a byte?', opts: ['1 bit', '8 bits', '16 bits', '32 bits'], correct: 1, exp: 'A byte is 8 bits of data' },
      { q: 'What is cloud storage?', opts: ['Physical disk', 'Online storage', 'USB drive', 'CD'], correct: 1, exp: 'Cloud storage is online/internet-based storage' },
      { q: 'What does HTML stand for?', opts: ['High Tech Modern Language', 'HyperText Markup Language', 'Home Tool Markup Language', 'Hyper Transfer Main Language'], correct: 1, exp: 'HTML stands for HyperText Markup Language' },
      { q: 'What is a virus in computing?', opts: ['Hardware', 'Malicious program', 'Good software', 'Internet'], correct: 1, exp: 'A computer virus is a malicious program' },
      { q: 'What does URL stand for?', opts: ['Universal Resource Locator', 'Uniform Resource Locator', 'United Resource Link', 'Universal Research Link'], correct: 1, exp: 'URL stands for Uniform Resource Locator' },
      { q: 'What is encryption?', opts: ['Deleting data', 'Coding data for security', 'Copying data', 'Sharing data'], correct: 1, exp: 'Encryption converts data into coded form for security' },
      { q: 'What is debugging?', opts: ['Creating bugs', 'Finding and fixing errors', 'Deleting programs', 'Making programs'], correct: 1, exp: 'Debugging is finding and fixing errors in code' },
      { q: 'What is a pixel?', opts: ['Type of file', 'Smallest unit of image', 'Internet speed', 'Computer chip'], correct: 1, exp: 'A pixel is the smallest unit of a digital image' },
      { q: 'What does GUI stand for?', opts: ['General User Interface', 'Graphical User Interface', 'Global Unit Interface', 'Graphics Utility Interface'], correct: 1, exp: 'GUI stands for Graphical User Interface' },
      { q: 'What is binary code?', opts: ['Letters only', '0s and 1s', 'Numbers 0-9', 'All symbols'], correct: 1, exp: 'Binary code uses only 0s and 1s' },
      { q: 'What is malware?', opts: ['Good software', 'Harmful software', 'Hardware', 'Internet'], correct: 1, exp: 'Malware is harmful/malicious software' },
      { q: 'What is open source?', opts: ['Closed code', 'Publicly available code', 'Private code', 'Encrypted code'], correct: 1, exp: 'Open source code is publicly available and modifiable' }
    ]
  }
};

function getQuestionsForGrade(subject, grade) {
  const bank = questionBanks[subject];
  if (!bank) return questionBanks['Science']['default'];
  
  const gradeKey = `Grade ${grade}`;
  return bank[gradeKey] || bank['default'] || questionBanks['Science']['default'];
}

async function createComprehensiveQuiz(lesson) {
  const questions = getQuestionsForGrade(lesson.subject, lesson.grade);
  
  // Select 10 random questions from the bank
  const shuffled = questions.sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 10);
  
  return {
    lessonId: lesson._id,
    title: `${lesson.subject} - ${lesson.term} Quiz`,
    description: `Comprehensive assessment for ${lesson.subject} Grade ${lesson.grade} covering ${lesson.term} material. Pass with 70% or higher!`,
    questions: selected.map(q => ({
      question: q.q,
      options: q.opts,
      correctAnswer: q.correct,
      explanation: q.exp
    })),
    passingScore: 70,
    timeLimit: 600 // 10 minutes
  };
}

async function seedComprehensiveQuizzes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📚 Fetching all lessons...');
    const lessons = await Lesson.find({}).lean();
    console.log(`Found ${lessons.length} lessons\n`);

    if (lessons.length === 0) {
      console.log('⚠️  No lessons found. Please seed lessons first.');
      return;
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    console.log('🎯 Creating/Updating comprehensive quizzes...\n');

    for (const lesson of lessons) {
      try {
        const quizData = await createComprehensiveQuiz(lesson);
        
        // Update if exists, create if not
        const result = await Quiz.findOneAndUpdate(
          { lessonId: lesson._id },
          quizData,
          { upsert: true, new: true }
        );

        if (result) {
          const existed = await Quiz.countDocuments({ lessonId: lesson._id });
          if (existed > 1) {
            updated++;
            console.log(`🔄 Updated: ${lesson.subject} - Grade ${lesson.grade} - ${lesson.term}`);
          } else {
            created++;
            console.log(`✅ Created: ${lesson.subject} - Grade ${lesson.grade} - ${lesson.term}`);
          }
        }
      } catch (error) {
        failed++;
        console.log(`❌ Failed: ${lesson.subject} - Grade ${lesson.grade} - ${lesson.term} (${error.message})`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 Comprehensive Quiz Seeding Summary:');
    console.log(`✅ Quizzes created: ${created}`);
    console.log(`🔄 Quizzes updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📚 Total lessons processed: ${lessons.length}`);
    console.log('='.repeat(70));
    console.log('\n✨ All quizzes have been seeded successfully!');
    console.log('\nℹ️  Each quiz contains 10 randomized questions from a larger question bank');
    console.log('ℹ️  Passing score: 70% | Time limit: 10 minutes');

  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
}

seedComprehensiveQuizzes();
