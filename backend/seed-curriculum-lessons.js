import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Connect to MongoDB - use VITE_MONGODB_URI directly
const MONGODB_URI = "mongodb+srv://mindsta_gmailcom:mindsta123@minsta-cluster.euihjmn.mongodb.net/mindsta?retryWrites=true&w=majority&appName=minsta-cluster";

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String,
  description: { type: String, required: true },
  content: String,
  subject: { type: String, required: true },
  grade: { type: String, required: true },
  term: {
    type: String,
    enum: ['First Term', 'Second Term', 'Third Term'],
    required: true,
  },
  order: { type: Number, default: 0 },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'easy', 'medium', 'hard'],
    default: 'beginner',
  },
  duration: { type: Number, default: 30 },
  imageUrl: String,
  videoUrl: String,
  keywords: [String],
  learningObjectives: [String],
  whatYouWillLearn: [String],
  requirements: [String],
  targetAudience: [String],
  curriculum: [Object],
}, { timestamps: true });

const Lesson = mongoose.model('Lesson', LessonSchema);

const curriculumLessons = [
  // MATHEMATICS - GRADE 5 - FIRST TERM
  {
    title: "Introduction to Fractions",
    subtitle: "Master the basics of fractions and their applications",
    description: "A comprehensive course covering fraction fundamentals, operations, and real-world applications. Perfect for Grade 5 students beginning their fraction journey.",
    subject: "Mathematics",
    grade: "5",
    term: "First Term",
    difficulty: "beginner",
    imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400",
    whatYouWillLearn: [
      "Understand what fractions represent",
      "Identify numerators and denominators",
      "Compare and order fractions",
      "Add and subtract simple fractions",
      "Apply fractions to real-world problems"
    ],
    requirements: [
      "Basic understanding of division",
      "Multiplication tables up to 12",
      "Understanding of parts and wholes"
    ],
    targetAudience: [
      "Grade 5 students",
      "Students new to fractions",
      "Anyone wanting to strengthen fraction basics"
    ],
    curriculum: [
      {
        title: "Understanding Fractions",
        description: "Learn what fractions are and how they work",
        order: 0,
        lectures: [
          {
            title: "What is a Fraction?",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/uaGaVJSbbSg",
            duration: 12,
            order: 0,
            content: "Introduction to the concept of fractions",
            resources: [
              {
                title: "Fraction Basics Worksheet",
                type: "pdf",
                url: "https://example.com/fraction-basics.pdf",
                description: "Practice identifying fractions"
              }
            ]
          },
          {
            title: "Parts of a Fraction",
            type: "article",
            duration: 8,
            order: 1,
            content: "# Parts of a Fraction\n\nA fraction has two main parts:\n\n## Numerator\nThe top number tells us how many parts we have.\n\n## Denominator\nThe bottom number tells us how many equal parts the whole is divided into.\n\nExample: In 3/4, 3 is the numerator and 4 is the denominator.",
            resources: []
          },
          {
            title: "Visualizing Fractions with Shapes",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/oUMp4u2dPfg",
            duration: 10,
            order: 2,
            content: "Learn to see fractions in circles, rectangles, and number lines",
            resources: [
              {
                title: "Fraction Visual Guide",
                type: "pdf",
                url: "https://example.com/fraction-visuals.pdf",
                description: "Printable fraction shapes"
              }
            ]
          },
          {
            title: "Equivalent Fractions",
            type: "article",
            duration: 12,
            order: 3,
            content: "# Equivalent Fractions\n\nDifferent fractions can represent the same amount!\n\n## What are Equivalent Fractions?\nFractions that look different but have the same value.\n\nExample: 1/2 = 2/4 = 3/6 = 4/8\n\n## Finding Equivalent Fractions\nMultiply or divide both numerator and denominator by the same number.\n\n**Try it:** 2/3 × 2/2 = 4/6",
            resources: []
          },
          {
            title: "Practice Quiz: Fraction Basics",
            type: "quiz",
            duration: 5,
            order: 4,
            content: "Test your understanding of fraction fundamentals",
            resources: []
          }
        ]
      },
      {
        title: "Comparing Fractions",
        description: "Learn to compare and order fractions",
        order: 1,
        lectures: [
          {
            title: "Comparing Fractions with Same Denominators",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/jZXS6B-JEic",
            duration: 10,
            order: 0,
            content: "Learn how to compare fractions when denominators are the same",
            resources: []
          },
          {
            title: "Comparing Fractions with Different Denominators",
            type: "article",
            duration: 15,
            order: 1,
            content: "# Comparing Different Denominators\n\nWhen fractions have different denominators, we need to find a common denominator first.\n\n## Steps:\n1. Find the Least Common Multiple (LCM)\n2. Convert both fractions\n3. Compare the numerators\n\nExample: Compare 1/2 and 2/5\n- LCM of 2 and 5 is 10\n- 1/2 = 5/10\n- 2/5 = 4/10\n- Therefore, 1/2 > 2/5",
            resources: [
              {
                title: "Comparison Practice Problems",
                type: "pdf",
                url: "https://example.com/compare-fractions.pdf",
                description: "20 practice problems with solutions"
              }
            ]
          },
          {
            title: "Finding Common Denominators",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/KwW38a_HNcA",
            duration: 12,
            order: 2,
            content: "Master the skill of finding least common denominators",
            resources: []
          },
          {
            title: "Ordering Multiple Fractions",
            type: "article",
            duration: 10,
            order: 3,
            content: "# Ordering Fractions from Least to Greatest\n\n## Strategy:\n1. Find a common denominator for all fractions\n2. Convert each fraction\n3. Compare numerators\n4. Write in order\n\nExample: Order 1/3, 1/2, 2/5\n- Common denominator: 30\n- 1/3 = 10/30, 1/2 = 15/30, 2/5 = 12/30\n- Order: 10/30 < 12/30 < 15/30\n- Answer: 1/3 < 2/5 < 1/2",
            resources: []
          },
          {
            title: "Comparison Practice Quiz",
            type: "quiz",
            duration: 8,
            order: 4,
            content: "Test your fraction comparison skills",
            resources: []
          }
        ]
      },
      {
        title: "Adding and Subtracting Fractions",
        description: "Master fraction operations",
        order: 2,
        lectures: [
          {
            title: "Adding Fractions with Same Denominators",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/FLQ6xFZzbcw",
            duration: 12,
            order: 0,
            content: "Learn the simple process of adding like fractions",
            resources: []
          },
          {
            title: "Adding Fractions with Different Denominators",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/SZBV2GF16EA",
            duration: 15,
            order: 1,
            content: "Step-by-step guide to adding unlike fractions",
            resources: [
              {
                title: "Addition Practice Sheet",
                type: "pdf",
                url: "https://example.com/add-fractions.pdf",
                description: "30 addition problems with answers"
              }
            ]
          },
          {
            title: "Subtracting Fractions",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/Y6fO-XdN75E",
            duration: 10,
            order: 2,
            content: "Master subtraction with fractions",
            resources: []
          },
          {
            title: "Mixed Numbers and Improper Fractions",
            type: "article",
            duration: 12,
            order: 3,
            content: "# Working with Mixed Numbers\n\n## What is a Mixed Number?\nA whole number plus a fraction: 2 1/2\n\n## What is an Improper Fraction?\nNumerator is larger than denominator: 5/2\n\n## Converting:\n- Mixed to Improper: 2 1/2 = (2×2 + 1)/2 = 5/2\n- Improper to Mixed: 7/3 = 2 1/3\n\n## Why It Matters:\nSometimes you need to convert before adding or subtracting!",
            resources: []
          },
          {
            title: "Simplifying Your Answers",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/mq_V68hcmPM",
            duration: 8,
            order: 4,
            content: "Learn to reduce fractions to simplest form",
            resources: []
          },
          {
            title: "Real-World Applications",
            type: "assignment",
            duration: 20,
            order: 5,
            content: "# Fraction Word Problems\n\nSolve these real-world problems using fractions:\n\n1. Sarah ate 1/4 of a pizza and her brother ate 2/4. How much pizza did they eat together?\n\n2. A recipe needs 3/4 cup of sugar. You've already added 1/4 cup. How much more do you need?\n\n3. You have 5/8 of a meter of ribbon. You use 2/8 for a project. How much ribbon is left?\n\n4. John ran 2 1/4 miles on Monday and 1 3/4 miles on Tuesday. How many total miles?\n\n5. A cake recipe needs 2/3 cup of oil. You only have 1/2 cup. How much more do you need?",
            resources: [
              {
                title: "Word Problems Answer Key",
                type: "pdf",
                url: "https://example.com/word-problems-answers.pdf",
                description: "Detailed solutions for all problems"
              }
            ]
          },
          {
            title: "Section Review Quiz",
            type: "quiz",
            duration: 10,
            order: 6,
            content: "Comprehensive quiz on adding and subtracting fractions",
            resources: []
          }
        ]
      }
    ]
  },

  // ENGLISH - GRADE 4 - FIRST TERM
  {
    title: "Creative Writing: Storytelling Basics",
    subtitle: "Learn to write engaging stories that captivate readers",
    description: "Discover the fundamentals of creative writing and storytelling. Students will learn story structure, character development, and descriptive writing techniques.",
    subject: "English",
    grade: "4",
    term: "First Term",
    difficulty: "beginner",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400",
    whatYouWillLearn: [
      "Create compelling story characters",
      "Structure stories with beginning, middle, and end",
      "Use descriptive language effectively",
      "Write engaging dialogue",
      "Edit and improve your stories"
    ],
    requirements: [
      "Basic reading and writing skills",
      "Enthusiasm for storytelling",
      "Willingness to share creative ideas"
    ],
    targetAudience: [
      "Grade 4 students",
      "Young aspiring writers",
      "Students who love stories"
    ],
    curriculum: [
      {
        title: "Story Elements",
        description: "Understanding the building blocks of great stories",
        order: 0,
        lectures: [
          {
            title: "What Makes a Good Story?",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/YveSLHZz6a4",
            duration: 15,
            order: 0,
            content: "Explore the essential elements that make stories engaging",
            resources: []
          },
          {
            title: "Story Structure: Beginning, Middle, End",
            type: "article",
            duration: 10,
            order: 1,
            content: "# Story Structure\n\n## Beginning (Introduction)\n- Introduce your main character\n- Set the scene\n- Present the problem or challenge\n\n## Middle (Rising Action)\n- Build the story\n- Add obstacles and challenges\n- Keep readers interested\n\n## End (Resolution)\n- Solve the problem\n- Show how characters changed\n- Give readers satisfaction",
            resources: [
              {
                title: "Story Planning Template",
                type: "document",
                url: "https://example.com/story-template.pdf",
                description: "A worksheet to plan your story"
              }
            ]
          },
          {
            title: "Plot: The Story's Journey",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/j36b8HlM7fY",
            duration: 12,
            order: 2,
            content: "Understanding plot development and story arcs",
            resources: []
          },
          {
            title: "Setting: Creating Your Story World",
            type: "article",
            duration: 10,
            order: 3,
            content: "# Creating Vivid Settings\n\n## What is Setting?\nWhere and when your story takes place.\n\n## Important Elements:\n- Time period (past, present, future)\n- Location (city, forest, space, etc.)\n- Season and weather\n- Time of day\n\n## Show the Setting:\nDon't just say \"forest\" - describe the tall trees, crunching leaves, bird songs, and misty morning air!",
            resources: []
          },
          {
            title: "Conflict: The Heart of Your Story",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/96vMF97p3gE",
            duration: 8,
            order: 4,
            content: "Learn about different types of conflict in stories",
            resources: []
          },
          {
            title: "Story Elements Quiz",
            type: "quiz",
            duration: 5,
            order: 5,
            content: "Test your knowledge of story elements",
            resources: []
          }
        ]
      },
      {
        title: "Creating Characters",
        description: "Bring your story people to life",
        order: 1,
        lectures: [
          {
            title: "Character Development Basics",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/XY5wON4dCvA",
            duration: 12,
            order: 0,
            content: "Learn how to create memorable characters",
            resources: []
          },
          {
            title: "Character Profiles",
            type: "article",
            duration: 15,
            order: 1,
            content: "# Creating Character Profiles\n\nGive your characters depth by answering these questions:\n\n## Physical Traits\n- What do they look like?\n- How old are they?\n- What do they wear?\n\n## Personality\n- What are they like?\n- What do they love?\n- What are they afraid of?\n\n## Background\n- Where do they come from?\n- What is their family like?\n- What is their biggest dream?",
            resources: [
              {
                title: "Character Profile Worksheet",
                type: "pdf",
                url: "https://example.com/character-worksheet.pdf",
                description: "Fill out details about your character"
              }
            ]
          },
          {
            title: "Heroes and Villains",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/5SZ0gF7Fu0M",
            duration: 10,
            order: 2,
            content: "Creating protagonists and antagonists",
            resources: []
          },
          {
            title: "Character Emotions and Reactions",
            type: "article",
            duration: 12,
            order: 3,
            content: "# Showing Character Emotions\n\n## Don't Tell - Show!\n\n**Instead of:** \"Sam was angry.\"\n**Write:** \"Sam's fists clenched. Her face turned red. She stomped out of the room.\"\n\n## Body Language Shows Feelings:\n- Happy: smiling, bouncing, bright eyes\n- Sad: slumped shoulders, tears, quiet voice\n- Scared: trembling, wide eyes, backing away\n- Excited: jumping, fast speech, can't sit still",
            resources: []
          },
          {
            title: "Writing Dialogue",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/Y_PgRSvxbxs",
            duration: 10,
            order: 4,
            content: "Make your characters talk naturally and interestingly",
            resources: []
          },
          {
            title: "Character Voice and Personality",
            type: "article",
            duration: 8,
            order: 5,
            content: "# Giving Characters Unique Voices\n\nEach character should sound different!\n\n## Tips:\n- Young characters use simple words\n- Smart characters might use big words\n- Shy characters speak softly\n- Brave characters speak confidently\n\n## Example:\n- Timid Mouse: \"Um... maybe we could... if you don't mind...\"\n- Bold Lion: \"Let's do it! I'll lead the way!\"",
            resources: []
          },
          {
            title: "Character Assignment",
            type: "assignment",
            duration: 15,
            order: 6,
            content: "# Create Your Character\n\nFill out a complete character profile:\n\n1. Draw or describe your character\n2. List 5 personality traits\n3. Write their backstory (3-4 sentences)\n4. Write a dialogue sample (10 lines)\n5. Describe how they react when scared\n\nBe creative and detailed!",
            resources: []
          }
        ]
      },
      {
        title: "Descriptive Writing",
        description: "Paint pictures with words",
        order: 2,
        lectures: [
          {
            title: "Using the Five Senses",
            type: "article",
            duration: 10,
            order: 0,
            content: "# Descriptive Writing with Five Senses\n\nMake your writing come alive by describing what characters:\n\n1. **See** - colors, shapes, movements\n2. **Hear** - sounds, noises, voices\n3. **Smell** - scents, aromas, odors\n4. **Taste** - flavors, textures in mouth\n5. **Touch** - textures, temperatures, feelings\n\nInstead of: \"The garden was nice.\"\nTry: \"The garden burst with red and yellow flowers. Bees buzzed around sweet-smelling roses, and the morning dew felt cool on the grass.\"",
            resources: []
          },
          {
            title: "Powerful Adjectives and Verbs",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/g7_I6kj9fTc",
            duration: 10,
            order: 1,
            content: "Choose strong words to make your writing vivid",
            resources: [
              {
                title: "Word Choice Guide",
                type: "pdf",
                url: "https://example.com/strong-words.pdf",
                description: "Lists of powerful adjectives and verbs"
              }
            ]
          },
          {
            title: "Show, Don't Tell",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/lcVdV-uDdXk",
            duration: 8,
            order: 2,
            content: "Learn to show emotions and actions instead of just telling",
            resources: []
          },
          {
            title: "Similes and Metaphors",
            type: "article",
            duration: 12,
            order: 3,
            content: "# Using Comparisons\n\n## Similes (using \"like\" or \"as\")\n- Her smile was as bright as the sun\n- He ran like a cheetah\n- The pillow was as soft as a cloud\n\n## Metaphors (saying something IS something else)\n- Time is money\n- Her eyes were sparkling diamonds\n- The classroom was a zoo\n\n## Practice:\nCreate 3 similes and 3 metaphors about:\n- A thunderstorm\n- A happy moment\n- Your favorite food",
            resources: []
          },
          {
            title: "Describing Action Scenes",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/0PNP8q0yMhU",
            duration: 10,
            order: 4,
            content: "Make action exciting with great descriptions",
            resources: []
          },
          {
            title: "Practice: Describe a Place",
            type: "assignment",
            duration: 15,
            order: 5,
            content: "# Descriptive Writing Exercise\n\nWrite a detailed description of your favorite place:\n\n## Requirements:\n- Use all five senses\n- Include at least 2 similes or metaphors\n- Show emotions through description\n- Write 1-2 paragraphs\n- Use strong adjectives and verbs\n\n## Example Places:\n- Your bedroom\n- A park\n- The beach\n- Your school cafeteria\n- A magical land you imagine",
            resources: []
          },
          {
            title: "Writing Assignment: Your First Story",
            type: "assignment",
            duration: 30,
            order: 6,
            content: "# Your Story Assignment\n\nWrite a short story (2-3 pages) that includes:\n\n1. A main character with a clear personality\n2. A problem they need to solve\n3. At least one scene using all five senses\n4. Dialogue between characters\n5. A satisfying ending\n\nRemember to:\n- Use descriptive language\n- Show, don't tell\n- Check your spelling and grammar\n- Make your character's voice unique\n- Create a vivid setting",
            resources: [
              {
                title: "Story Writing Checklist",
                type: "pdf",
                url: "https://example.com/story-checklist.pdf",
                description: "Use this to make sure your story is complete"
              },
              {
                title: "Editing Guide",
                type: "pdf",
                url: "https://example.com/editing-guide.pdf",
                description: "How to revise and improve your story"
              }
            ]
          }
        ]
      }
    ]
  },

  // SCIENCE - GRADE 6 - SECOND TERM
  {
    title: "The Water Cycle and Weather",
    subtitle: "Explore how water moves through our planet and affects weather",
    description: "Understanding the water cycle and its role in creating weather patterns. Students will learn about evaporation, condensation, precipitation, and how these processes impact our daily lives.",
    subject: "Science",
    grade: "6",
    term: "Second Term",
    difficulty: "intermediate",
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=400",
    whatYouWillLearn: [
      "Understand the complete water cycle",
      "Explain evaporation and condensation",
      "Identify different types of precipitation",
      "Predict basic weather patterns",
      "Understand climate vs weather"
    ],
    requirements: [
      "Basic understanding of states of matter",
      "Knowledge of temperature and heat",
      "Curiosity about natural phenomena"
    ],
    targetAudience: [
      "Grade 6 science students",
      "Students interested in weather",
      "Future meteorologists"
    ],
    curriculum: [
      {
        title: "Water Cycle Basics",
        description: "Understanding Earth's water system",
        order: 0,
        lectures: [
          {
            title: "Introduction to the Water Cycle",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/al-do-HGuIk",
            duration: 15,
            order: 0,
            content: "Overview of how water continuously moves through Earth's systems",
            resources: [
              {
                title: "Water Cycle Diagram",
                type: "image",
                url: "https://example.com/water-cycle-diagram.png",
                description: "Labeled diagram showing all stages"
              }
            ]
          },
          {
            title: "Evaporation: Water Becomes Vapor",
            type: "article",
            duration: 12,
            order: 1,
            content: "# Evaporation\n\n## What is Evaporation?\nEvaporation is when liquid water turns into water vapor (gas).\n\n## Where Does It Happen?\n- Oceans and seas\n- Lakes and rivers\n- Puddles and wet surfaces\n- Plants (transpiration)\n\n## What Causes It?\n- Heat from the sun\n- Wind that moves vapor away\n- Low humidity in the air\n\n## Fun Fact\n85% of evaporation comes from oceans!\n\n## Try This\nLeave a wet towel outside on a sunny day and see how evaporation works!",
            resources: []
          },
          {
            title: "Transpiration: Plants and Water",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/IuWoXkkFfGM",
            duration: 8,
            order: 2,
            content: "How plants release water vapor into the atmosphere",
            resources: []
          },
          {
            title: "Condensation: Making Clouds",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/Z-jfmCIKqR4",
            duration: 10,
            order: 3,
            content: "Learn how water vapor becomes clouds",
            resources: []
          },
          {
            title: "Cloud Formation Experiment",
            type: "article",
            duration: 12,
            order: 4,
            content: "# Make a Cloud in a Jar!\n\n## Materials:\n- Glass jar with lid\n- Hot water\n- Ice cubes\n- Hairspray (optional)\n\n## Steps:\n1. Pour hot water into jar (about 1 inch)\n2. Swirl it around\n3. Put ice on the lid\n4. Spray a tiny bit of hairspray in the jar\n5. Put lid on quickly\n6. Watch the cloud form!\n\n## What's Happening?\n- Hot water evaporates\n- Rising vapor hits cold air (ice)\n- Water vapor condenses into tiny droplets\n- These droplets make a cloud!",
            resources: [
              {
                title: "Experiment Safety Guide",
                type: "pdf",
                url: "https://example.com/science-safety.pdf",
                description: "Safety rules for science experiments"
              }
            ]
          },
          {
            title: "Water Cycle Quiz",
            type: "quiz",
            duration: 5,
            order: 5,
            content: "Test your knowledge of evaporation and condensation",
            resources: []
          }
        ]
      },
      {
        title: "Precipitation and Collection",
        description: "How water returns to Earth",
        order: 1,
        lectures: [
          {
            title: "Types of Precipitation",
            type: "article",
            duration: 15,
            order: 0,
            content: "# Forms of Precipitation\n\n## Rain\n- Water droplets that fall from clouds\n- Most common form of precipitation\n- Temperature above 0°C (32°F)\n\n## Snow\n- Ice crystals that fall from clouds\n- Forms when temperature is below 0°C\n- Each snowflake has a unique shape\n\n## Sleet\n- Rain that freezes as it falls\n- Forms ice pellets\n- Bounces when it hits the ground\n\n## Hail\n- Balls of ice that fall during thunderstorms\n- Can be as small as a pea or as large as a softball\n- Forms in strong updrafts\n\n## Measuring Precipitation\nRain gauge: Tool that measures how much rain falls",
            resources: [
              {
                title: "Precipitation Types Chart",
                type: "pdf",
                url: "https://example.com/precipitation-chart.pdf",
                description: "Visual guide to precipitation types"
              }
            ]
          },
          {
            title: "How Rain Forms",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/C0BNBs2WUhA",
            duration: 10,
            order: 1,
            content: "The journey from cloud droplet to raindrop",
            resources: []
          },
          {
            title: "Snowflakes: Nature's Art",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/ao2Jfm35XeE",
            duration: 8,
            order: 2,
            content: "The amazing science of snowflake formation",
            resources: []
          },
          {
            title: "Building a Rain Gauge",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/mxjUW43uXCs",
            duration: 12,
            order: 3,
            content: "Hands-on project to measure rainfall",
            resources: [
              {
                title: "Rain Gauge Instructions",
                type: "pdf",
                url: "https://example.com/rain-gauge-build.pdf",
                description: "Step-by-step building guide"
              }
            ]
          },
          {
            title: "Collection: Where Water Goes",
            type: "article",
            duration: 10,
            order: 4,
            content: "# Water Collection\n\n## Where Does Precipitation Go?\n\n### Surface Water\n- Lakes and ponds\n- Rivers and streams\n- Oceans\n\n### Groundwater\n- Soaks into soil\n- Fills underground aquifers\n- Feeds wells and springs\n\n### Back to the Atmosphere\n- Some evaporates immediately\n- Plants absorb and transpire\n\n## The Cycle Continues!\nWater in collection areas will eventually evaporate again, continuing the endless cycle.",
            resources: []
          },
          {
            title: "Precipitation Quiz",
            type: "quiz",
            duration: 7,
            order: 5,
            content: "Test your understanding of precipitation",
            resources: []
          }
        ]
      },
      {
        title: "Weather Patterns",
        description: "Understanding how weather works",
        order: 2,
        lectures: [
          {
            title: "Weather vs Climate",
            type: "article",
            duration: 10,
            order: 0,
            content: "# Weather vs Climate\n\n## Weather\n- Day-to-day conditions\n- Changes quickly\n- Examples: rainy today, sunny tomorrow\n\n## Climate\n- Long-term patterns over many years\n- Changes slowly\n- Examples: tropical, temperate, polar\n\n## Remember\n**Weather is what you see out the window today. Climate is what you expect over the year.**",
            resources: []
          },
          {
            title: "Air Pressure and Weather",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/USRIJZI36Uw",
            duration: 12,
            order: 1,
            content: "How high and low pressure systems affect weather",
            resources: []
          },
          {
            title: "Wind: Air in Motion",
            type: "article",
            duration: 10,
            order: 2,
            content: "# Understanding Wind\n\n## What Causes Wind?\nAir moves from high pressure to low pressure areas.\n\n## Types of Wind:\n- **Local winds**: Sea breeze, land breeze\n- **Global winds**: Trade winds, westerlies\n\n## Wind Speed:\n- Calm: 0-1 mph\n- Light breeze: 4-7 mph\n- Strong wind: 25-31 mph\n- Storm: 55+ mph\n\n## Fun Fact:\nThe fastest wind ever recorded was 253 mph during a tornado!",
            resources: []
          },
          {
            title: "Cloud Types and Weather Prediction",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/YLnSTRmRG4g",
            duration: 14,
            order: 3,
            content: "Learn to identify clouds and predict weather",
            resources: [
              {
                title: "Cloud Identification Guide",
                type: "pdf",
                url: "https://example.com/cloud-types.pdf",
                description: "Photo guide to cloud types"
              }
            ]
          },
          {
            title: "Reading Weather Maps",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/Ox5pq0xfWVo",
            duration: 15,
            order: 4,
            content: "Learn to understand weather forecasts and maps",
            resources: []
          },
          {
            title: "Severe Weather Safety",
            type: "article",
            duration: 12,
            order: 5,
            content: "# Staying Safe in Severe Weather\n\n## Thunderstorms\n- Stay indoors\n- Avoid windows\n- Don't use electronics plugged in\n- Wait 30 minutes after last thunder\n\n## Tornadoes\n- Go to basement or interior room\n- Stay away from windows\n- Cover your head\n\n## Floods\n- Never walk or drive through flood water\n- Move to higher ground\n- Stay informed with weather radio\n\n## Winter Storms\n- Stay indoors if possible\n- Dress in warm layers\n- Avoid overexertion in cold",
            resources: []
          },
          {
            title: "Weather Investigation Project",
            type: "assignment",
            duration: 25,
            order: 6,
            content: "# Weather Tracking Project\n\n## Assignment\nTrack weather for 7 days and analyze patterns.\n\n## What to Record Daily:\n1. Temperature (morning and afternoon)\n2. Cloud cover (clear, partly cloudy, cloudy)\n3. Precipitation (type and amount)\n4. Wind (calm, breezy, windy)\n5. Your observations\n\n## Final Report Should Include:\n- Your data table\n- A graph showing temperature changes\n- Description of any patterns you noticed\n- Connection to the water cycle\n- Prediction for the next day\n\n## Materials Needed:\n- Thermometer\n- Rain gauge (from previous lesson)\n- Notebook for observations",
            resources: [
              {
                title: "Weather Tracking Sheet",
                type: "pdf",
                url: "https://example.com/weather-tracking.pdf",
                description: "Template for recording daily weather"
              },
              {
                title: "Project Rubric",
                type: "pdf",
                url: "https://example.com/weather-project-rubric.pdf",
                description: "Grading criteria for your project"
              }
            ]
          },
          {
            title: "Final Quiz: Water Cycle and Weather",
            type: "quiz",
            duration: 10,
            order: 7,
            content: "Comprehensive assessment of all topics covered",
            resources: []
          }
        ]
      }
    ]
  },

  // SOCIAL STUDIES - GRADE 5 - THIRD TERM
  {
    title: "Ancient Civilizations: Egypt",
    subtitle: "Journey back to the land of pharaohs and pyramids",
    description: "Explore the fascinating world of Ancient Egypt. Learn about pharaohs, pyramids, hieroglyphics, and daily life along the Nile River.",
    subject: "Social Studies",
    grade: "5",
    term: "Third Term",
    difficulty: "intermediate",
    imageUrl: "https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=400",
    whatYouWillLearn: [
      "Identify key features of Ancient Egyptian civilization",
      "Understand the role of the Nile River",
      "Explain the social hierarchy and daily life",
      "Recognize important pharaohs and their achievements",
      "Decode basic hieroglyphic symbols"
    ],
    requirements: [
      "Basic map reading skills",
      "Interest in history and culture",
      "Ability to take notes"
    ],
    targetAudience: [
      "Grade 5 students",
      "History enthusiasts",
      "Students interested in archaeology"
    ],
    curriculum: [
      {
        title: "Geography and the Nile",
        description: "Why Egypt developed where it did",
        order: 0,
        lectures: [
          {
            title: "The Gift of the Nile",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/W3NID5NpTNo",
            duration: 15,
            order: 0,
            content: "Discover why the Nile River was so important to Ancient Egypt",
            resources: [
              {
                title: "Ancient Egypt Map",
                type: "pdf",
                url: "https://example.com/egypt-map.pdf",
                description: "Map showing key locations in Ancient Egypt"
              }
            ]
          },
          {
            title: "Egyptian Geography",
            type: "article",
            duration: 12,
            order: 1,
            content: "# Geography of Ancient Egypt\n\n## The Nile River\n- Longest river in the world (4,000+ miles)\n- Flows from south to north\n- Annual floods brought rich soil\n- Provided water, food, and transportation\n\n## Upper and Lower Egypt\n- **Upper Egypt**: Southern region, narrow valley\n- **Lower Egypt**: Northern region, Nile Delta\n- United around 3100 BCE\n\n## The Desert\n- Protected Egypt from invaders\n- Called the \"Red Land\" (barren)\n- The fertile valley was the \"Black Land\"\n\n## Climate\n- Hot and dry\n- Relied on Nile floods for farming\n- Floods happened June-September",
            resources: []
          }
        ]
      },
      {
        title: "Society and Daily Life",
        description: "How Ancient Egyptians lived",
        order: 1,
        lectures: [
          {
            title: "The Social Pyramid",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/f08dN4R1YqY",
            duration: 12,
            order: 0,
            content: "Understanding Egyptian social classes",
            resources: []
          },
          {
            title: "Daily Life in Ancient Egypt",
            type: "article",
            duration: 15,
            order: 1,
            content: "# Daily Life\n\n## Social Classes (Pyramid Structure)\n\n### Pharaoh (Top)\n- Ruler and considered a god\n- Owned all the land\n- Most powerful person\n\n### Nobles and Priests\n- Helped pharaoh govern\n- Performed religious ceremonies\n- Lived in luxury\n\n### Scribes\n- Could read and write\n- Kept important records\n- Highly respected job\n\n### Craftsmen and Merchants\n- Made goods and traded\n- Skilled workers\n- Some were quite wealthy\n\n### Farmers and Laborers (Bottom)\n- Largest group\n- Worked the land\n- Paid taxes with crops\n- Built monuments\n\n## Family Life\n- Children were valued\n- Women had more rights than in other ancient cultures\n- Married young (boys 15, girls 12)\n- Owned pets (cats were sacred)",
            resources: [
              {
                title: "Social Pyramid Worksheet",
                type: "pdf",
                url: "https://example.com/social-pyramid.pdf",
                description: "Activity matching people to their social class"
              }
            ]
          },
          {
            title: "Egyptian Fashion and Beauty",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/dT5AqwHYkjo",
            duration: 10,
            order: 2,
            content: "Clothing, makeup, and jewelry in Ancient Egypt",
            resources: []
          }
        ]
      },
      {
        title: "Religion and Afterlife",
        description: "Egyptian beliefs and practices",
        order: 2,
        lectures: [
          {
            title: "Egyptian Gods and Goddesses",
            type: "article",
            duration: 15,
            order: 0,
            content: "# Major Egyptian Deities\n\n## Ra (Re)\n- Sun god\n- Most important god\n- Often shown with a falcon head and sun disk\n\n## Osiris\n- God of the afterlife\n- Judge of the dead\n- Brother of Isis and Set\n\n## Isis\n- Goddess of magic and motherhood\n- Wife of Osiris\n- Protected children\n\n## Anubis\n- God of mummification\n- Jackal-headed god\n- Guided souls to the afterlife\n\n## Horus\n- Sky god\n- Falcon-headed\n- Son of Osiris and Isis\n- Symbol of pharaoh's power\n\n## Bastet\n- Cat goddess\n- Protected homes\n- Goddess of joy\n\n## Thoth\n- God of wisdom and writing\n- Ibis-headed\n- Invented hieroglyphics",
            resources: [
              {
                title: "Egyptian Gods Chart",
                type: "pdf",
                url: "https://example.com/gods-chart.pdf",
                description: "Illustrated guide to major deities"
              }
            ]
          },
          {
            title: "Mummification Process",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/5MZMnPjPLlA",
            duration: 18,
            order: 1,
            content: "Learn about Egyptian burial practices and beliefs about afterlife",
            resources: []
          },
          {
            title: "Pyramids and Tombs",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/TswvNQbXpqg",
            duration: 15,
            order: 2,
            content: "How and why pyramids were built",
            resources: []
          }
        ]
      },
      {
        title: "Hieroglyphics and Achievements",
        description: "Egyptian writing and innovations",
        order: 3,
        lectures: [
          {
            title: "Reading Hieroglyphics",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/P6uoV05RAn4",
            duration: 12,
            order: 0,
            content: "Introduction to Egyptian picture writing",
            resources: [
              {
                title: "Hieroglyphic Alphabet",
                type: "pdf",
                url: "https://example.com/hieroglyphic-alphabet.pdf",
                description: "Write your name in hieroglyphics"
              }
            ]
          },
          {
            title: "Egyptian Innovations",
            type: "article",
            duration: 15,
            order: 1,
            content: "# Egyptian Achievements\n\n## Writing\n- Invented hieroglyphics (3200 BCE)\n- Developed papyrus paper\n- Kept detailed records\n\n## Architecture\n- Built massive pyramids\n- Constructed temples\n- Advanced engineering skills\n\n## Mathematics\n- Developed geometry\n- Used fractions\n- Calculated areas and volumes\n\n## Medicine\n- Performed surgery\n- Used herbs for healing\n- Understood some anatomy\n- Created medical texts\n\n## Calendar\n- 365-day calendar\n- Based on Nile floods and stars\n- 12 months of 30 days plus 5 extra days\n\n## Other Innovations\n- Irrigation systems\n- Plow for farming\n- Sailing boats\n- Cosmetics and perfumes\n- Glass making",
            resources: []
          },
          {
            title: "Ancient Egypt Project",
            type: "assignment",
            duration: 30,
            order: 2,
            content: "# Ancient Egypt Research Project\n\n## Choose ONE Topic:\n1. Famous Pharaoh (Tutankhamun, Cleopatra, Ramses II)\n2. Egyptian Innovation (pyramids, medicine, writing)\n3. Egyptian God/Goddess\n4. Daily Life of a specific social class\n\n## Your Project Must Include:\n\n### Written Report (2-3 pages)\n- Introduction: What is your topic?\n- Main Body: Key facts and information\n- Why was this important to Ancient Egypt?\n- What impressed you most?\n- Conclusion: What did you learn?\n\n### Visual Component (Choose ONE)\n- Poster with illustrations\n- Model (pyramid, sarcophagus, etc.)\n- Comic strip telling a story\n- PowerPoint presentation\n\n### Bibliography\n- List at least 3 sources\n- Include books, websites, or videos used\n\n## Presentation\n- Be ready to share with the class (3-5 minutes)\n- Speak clearly and make eye contact\n- Show enthusiasm for your topic!",
            resources: [
              {
                title: "Project Guidelines",
                type: "pdf",
                url: "https://example.com/egypt-project-guide.pdf",
                description: "Detailed requirements and rubric"
              },
              {
                title: "Recommended Resources",
                type: "link",
                url: "https://example.com/egypt-resources.html",
                description: "Websites and books for research"
              }
            ]
          }
        ]
      }
    ]
  },

  // ARTS & CRAFTS - GRADE 3 - FIRST TERM
  {
    title: "Introduction to Drawing",
    subtitle: "Learn the fundamentals of drawing and sketching",
    description: "Begin your artistic journey with basic drawing techniques. Learn about shapes, lines, shading, and perspective to create amazing artwork.",
    subject: "Arts & Crafts",
    grade: "3",
    term: "First Term",
    difficulty: "beginner",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400",
    whatYouWillLearn: [
      "Draw basic shapes confidently",
      "Use different types of lines",
      "Create depth with shading",
      "Understand basic perspective",
      "Draw simple objects and animals"
    ],
    requirements: [
      "Pencils and paper",
      "Eraser and sharpener",
      "Willingness to practice",
      "Creative mindset"
    ],
    targetAudience: [
      "Grade 3 students",
      "Beginning artists",
      "Anyone interested in drawing"
    ],
    curriculum: [
      {
        title: "Drawing Basics",
        description: "Essential skills for every artist",
        order: 0,
        lectures: [
          {
            title: "Holding Your Pencil",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/pMC0Cx3Uk84",
            duration: 8,
            order: 0,
            content: "Learn proper pencil grip for better control",
            resources: []
          },
          {
            title: "Basic Shapes",
            type: "article",
            duration: 10,
            order: 1,
            content: "# Learning Basic Shapes\n\nEverything you draw is made up of basic shapes!\n\n## The Big Five Shapes:\n\n1. **Circle** - Round like a ball\n2. **Square** - Four equal sides\n3. **Rectangle** - Like a door\n4. **Triangle** - Three sides\n5. **Oval** - Stretched circle\n\n## Practice Exercise:\n- Draw each shape 10 times\n- Try different sizes\n- Make them as perfect as you can\n- Use light pencil pressure\n\n## Shape Challenge:\nLook around your room - how many circles can you find? Squares? Rectangles?\n\nRemember: Even complex drawings start with simple shapes!",
            resources: [
              {
                title: "Shape Practice Worksheet",
                type: "pdf",
                url: "https://example.com/shapes-practice.pdf",
                description: "Practice sheets for all basic shapes"
              }
            ]
          },
          {
            title: "Types of Lines",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/2UR1WdMCmqI",
            duration: 12,
            order: 2,
            content: "Explore different line types and when to use them",
            resources: []
          }
        ]
      },
      {
        title: "Shading and Texture",
        description: "Making your drawings look 3D",
        order: 1,
        lectures: [
          {
            title: "Introduction to Shading",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/V3WmrWUEIJo",
            duration: 15,
            order: 0,
            content: "Learn how to add shadows and highlights",
            resources: []
          },
          {
            title: "Creating Textures",
            type: "article",
            duration: 12,
            order: 1,
            content: "# Drawing Different Textures\n\n## Smooth (like glass)\n- Light shading\n- Few lines\n- Blend well\n\n## Rough (like tree bark)\n- Many short lines\n- Darker areas\n- Random patterns\n\n## Soft (like fur)\n- Light, wispy lines\n- Follow the direction of fur\n- Layer lines\n\n## Hard (like rocks)\n- Sharp, defined edges\n- Strong shadows\n- Bold lines\n\n## Practice Project:\nDraw four squares and fill each with a different texture!",
            resources: [
              {
                title: "Texture Examples",
                type: "image",
                url: "https://example.com/texture-examples.png",
                description: "Reference images for different textures"
              }
            ]
          },
          {
            title: "Practice: Shading a Sphere",
            type: "assignment",
            duration: 20,
            order: 2,
            content: "# Shading Assignment: The Perfect Sphere\n\n## Steps:\n1. Draw a circle (use a cup to trace if needed)\n2. Decide where your light is coming from\n3. Leave that side very light\n4. Shade darker on the opposite side\n5. Add a cast shadow on the ground\n6. Blend your shading smoothly\n\n## Tips:\n- Press lighter for light areas\n- Press harder for dark areas\n- Use your finger or tissue to blend\n- Take your time!\n\n## Submit:\n- Your shaded sphere drawing\n- A photo showing where your light source is",
            resources: []
          }
        ]
      },
      {
        title: "Drawing Objects",
        description: "Putting skills together to draw real things",
        order: 2,
        lectures: [
          {
            title: "Breaking Objects into Shapes",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/b8RMRdlkpJE",
            duration: 15,
            order: 0,
            content: "Learn to see shapes in everyday objects",
            resources: []
          },
          {
            title: "Drawing a Simple House",
            type: "article",
            duration: 18,
            order: 1,
            content: "# Step-by-Step: Draw a House\n\n## Step 1: Basic Shapes\n- Draw a rectangle for the main building\n- Add a triangle on top for the roof\n\n## Step 2: Add Details\n- Draw squares for windows\n- Add a rectangle for the door\n- Draw a rectangle for the chimney\n\n## Step 3: Add More Features\n- Draw lines for the door panels\n- Add window panes (cross lines)\n- Draw bricks on the chimney\n- Add a path to the door\n\n## Step 4: Final Touches\n- Shade the roof\n- Add curtains in windows\n- Draw grass and flowers\n- Add clouds and sun\n\n## Make it YOUR house:\n- What color will you make it?\n- How many windows?\n- What's in the yard?",
            resources: [
              {
                title: "House Drawing Guide",
                type: "pdf",
                url: "https://example.com/house-drawing-steps.pdf",
                description: "Illustrated step-by-step guide"
              }
            ]
          },
          {
            title: "Drawing Simple Animals",
            type: "video",
            videoUrl: "https://www.youtube.com/embed/6VhLVHKaZ34",
            duration: 20,
            order: 2,
            content: "Learn to draw cute animals using basic shapes",
            resources: []
          },
          {
            title: "Final Project: My Favorite Scene",
            type: "assignment",
            duration: 30,
            order: 3,
            content: "# Final Drawing Project\n\n## Assignment:\nDraw a complete scene that shows what you've learned!\n\n## Your Scene Must Include:\n1. At least 3 different objects\n2. One animal or person\n3. A background (sky, ground, etc.)\n4. Shading to show light and shadow\n5. At least 2 different textures\n\n## Ideas for Scenes:\n- Your backyard or park\n- A farm with animals\n- A beach scene\n- Your bedroom\n- A jungle adventure\n- A space scene\n\n## Steps to Success:\n1. Sketch lightly first\n2. Break everything into basic shapes\n3. Add details\n4. Add shading and texture\n5. Color if you want (optional)\n\n## Checklist:\n- Did I use basic shapes?\n- Did I add shading?\n- Did I include textures?\n- Did I sign my artwork?\n\nBe proud of your work! Every artist started as a beginner.",
            resources: [
              {
                title: "Project Inspiration Gallery",
                type: "link",
                url: "https://example.com/drawing-inspiration.html",
                description: "Example scenes for ideas"
              },
              {
                title: "Self-Assessment Checklist",
                type: "pdf",
                url: "https://example.com/art-checklist.pdf",
                description: "Rate your own work"
              }
            ]
          }
        ]
      }
    ]
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    console.log('🌱 Seeding curriculum-based lessons...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const lessonData of curriculumLessons) {
      try {
        // Check if lesson already exists
        const existing = await Lesson.findOne({
          title: lessonData.title,
          grade: lessonData.grade,
          term: lessonData.term
        });

        if (existing) {
          console.log(`⚠️  Skipping: "${lessonData.title}" (already exists)`);
          continue;
        }

        // Calculate total duration from curriculum
        let totalDuration = 0;
        if (lessonData.curriculum && lessonData.curriculum.length > 0) {
          lessonData.curriculum.forEach(section => {
            section.lectures.forEach(lecture => {
              totalDuration += lecture.duration || 0;
            });
          });
          lessonData.duration = totalDuration;
        }

        const lesson = new Lesson(lessonData);
        await lesson.save();
        
        console.log(`✓ Created: "${lessonData.title}"`);
        console.log(`  Subject: ${lessonData.subject} | Grade: ${lessonData.grade} | Term: ${lessonData.term}`);
        console.log(`  Sections: ${lessonData.curriculum.length} | Total Duration: ${totalDuration}m\n`);
        
        successCount++;
      } catch (error) {
        console.error(`✗ Error creating "${lessonData.title}":`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✓ Successfully created: ${successCount} lessons`);
    console.log(`✗ Errors: ${errorCount}`);
    console.log(`⚠️  Skipped (duplicates): ${curriculumLessons.length - successCount - errorCount}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    console.log('🎉 Seeding complete!\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
