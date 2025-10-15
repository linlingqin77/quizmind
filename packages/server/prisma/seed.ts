import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 创建管理员用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // 创建教师用户
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teacher = await prisma.user.upsert({
    where: { username: 'teacher' },
    update: {},
    create: {
      username: 'teacher',
      email: 'teacher@example.com',
      password: teacherPassword,
      role: 'teacher',
    },
  });
  console.log('✅ Teacher user created:', teacher.username);

  // 创建学生用户
  const studentPassword = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { username: 'student' },
    update: {},
    create: {
      username: 'student',
      email: 'student@example.com',
      password: studentPassword,
      role: 'student',
    },
  });
  console.log('✅ Student user created:', student.username);

  // 创建题目分类
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: '数学' },
      update: {},
      create: {
        name: '数学',
        description: '数学相关题目',
      },
    }),
    prisma.category.upsert({
      where: { name: '编程' },
      update: {},
      create: {
        name: '编程',
        description: '编程相关题目',
      },
    }),
    prisma.category.upsert({
      where: { name: '英语' },
      update: {},
      create: {
        name: '英语',
        description: '英语相关题目',
      },
    }),
  ]);
  console.log('✅ Categories created');

  // 创建示例题目
  const questions = await Promise.all([
    prisma.question.create({
      data: {
        title: 'JavaScript 变量声明',
        content: '在 JavaScript 中，以下哪个关键字用于声明块级作用域的变量？',
        type: 'single_choice',
        options: JSON.stringify([
          { key: 'A', value: 'var' },
          { key: 'B', value: 'let' },
          { key: 'C', value: 'const' },
          { key: 'D', value: 'function' },
        ]),
        answer: 'B',
        explanation:
          'let 关键字用于声明块级作用域的变量，而 var 声明的是函数作用域或全局作用域的变量。',
        difficulty: 2,
        tags: ['JavaScript', '基础'],
        categoryId: categories[1].id,
        createdById: teacher.id,
      },
    }),
    prisma.question.create({
      data: {
        title: 'React Hooks',
        content: '以下哪个 Hook 用于在函数组件中添加状态？',
        type: 'single_choice',
        options: JSON.stringify([
          { key: 'A', value: 'useEffect' },
          { key: 'B', value: 'useState' },
          { key: 'C', value: 'useContext' },
          { key: 'D', value: 'useReducer' },
        ]),
        answer: 'B',
        explanation: 'useState 是用于在函数组件中添加状态的 Hook。',
        difficulty: 1,
        tags: ['React', 'Hooks'],
        categoryId: categories[1].id,
        createdById: teacher.id,
      },
    }),
  ]);
  console.log('✅ Questions created');

  // 创建示例考试
  const exam = await prisma.exam.create({
    data: {
      title: 'JavaScript 基础测试',
      description: '测试 JavaScript 基础知识',
      duration: 60,
      totalScore: 100,
      passScore: 60,
      status: 'published',
      createdById: teacher.id,
    },
  });

  // 添加题目到考试
  await Promise.all(
    questions.map((question, index) =>
      prisma.examQuestion.create({
        data: {
          examId: exam.id,
          questionId: question.id,
          score: 50,
          order: index,
        },
      }),
    ),
  );
  console.log('✅ Exam created with questions');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
