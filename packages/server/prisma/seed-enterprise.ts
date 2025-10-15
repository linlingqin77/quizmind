import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEnterpriseData() {
  console.log('开始种子企业级数据...');

  // 1. 创建权限
  const permissions = [
    // 用户管理权限
    { resource: 'user', action: 'create', description: '创建用户' },
    { resource: 'user', action: 'read', description: '查看用户' },
    { resource: 'user', action: 'update', description: '更新用户' },
    { resource: 'user', action: 'delete', description: '删除用户' },
    
    // 题目管理权限
    { resource: 'question', action: 'create', description: '创建题目' },
    { resource: 'question', action: 'read', description: '查看题目' },
    { resource: 'question', action: 'update', description: '更新题目' },
    { resource: 'question', action: 'delete', description: '删除题目' },
    
    // 考试管理权限
    { resource: 'exam', action: 'create', description: '创建考试' },
    { resource: 'exam', action: 'read', description: '查看考试' },
    { resource: 'exam', action: 'update', description: '更新考试' },
    { resource: 'exam', action: 'delete', description: '删除考试' },
    
    // 文件管理权限
    { resource: 'file', action: 'upload', description: '上传文件' },
    { resource: 'file', action: 'read', description: '查看文件' },
    { resource: 'file', action: 'delete', description: '删除文件' },
    
    // 系统管理权限
    { resource: 'system', action: 'admin', description: '系统管理' },
    { resource: 'audit', action: 'read', description: '查看审计日志' },
    { resource: 'queue', action: 'manage', description: '管理任务队列' },
  ];

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        resource_action: {
          resource: permission.resource,
          action: permission.action,
        },
      },
      update: {},
      create: permission,
    });
  }

  console.log('权限创建完成');

  // 2. 创建角色
  const roles = [
    {
      name: 'SUPER_ADMIN',
      displayName: '超级管理员',
      description: '拥有所有权限的超级管理员',
      isSystem: true,
    },
    {
      name: 'ADMIN',
      displayName: '管理员',
      description: '系统管理员，拥有大部分管理权限',
      isSystem: true,
    },
    {
      name: 'TEACHER',
      displayName: '教师',
      description: '教师角色，可以管理题目和考试',
      isSystem: true,
    },
    {
      name: 'STUDENT',
      displayName: '学生',
      description: '学生角色，可以参加考试和练习',
      isSystem: true,
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('角色创建完成');

  // 3. 分配权限给角色
  const rolePermissions = [
    // 超级管理员 - 所有权限
    {
      roleName: 'SUPER_ADMIN',
      permissions: permissions.map(p => `${p.resource}:${p.action}`),
    },
    // 管理员 - 除系统管理外的所有权限
    {
      roleName: 'ADMIN',
      permissions: [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'question:create', 'question:read', 'question:update', 'question:delete',
        'exam:create', 'exam:read', 'exam:update', 'exam:delete',
        'file:upload', 'file:read', 'file:delete',
        'audit:read',
      ],
    },
    // 教师 - 题目和考试管理权限
    {
      roleName: 'TEACHER',
      permissions: [
        'user:read',
        'question:create', 'question:read', 'question:update', 'question:delete',
        'exam:create', 'exam:read', 'exam:update', 'exam:delete',
        'file:upload', 'file:read',
      ],
    },
    // 学生 - 基本查看和参与权限
    {
      roleName: 'STUDENT',
      permissions: [
        'question:read',
        'exam:read',
        'file:upload', 'file:read',
      ],
    },
  ];

  for (const rolePermission of rolePermissions) {
    const role = await prisma.role.findUnique({
      where: { name: rolePermission.roleName },
    });

    if (role) {
      for (const permissionKey of rolePermission.permissions) {
        const [resource, action] = permissionKey.split(':');
        const permission = await prisma.permission.findUnique({
          where: {
            resource_action: { resource, action },
          },
        });

        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }
    }
  }

  console.log('角色权限分配完成');

  // 4. 更新现有用户的角色
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (adminUser) {
    const adminRole = await prisma.role.findUnique({
      where: { name: 'ADMIN' },
    });

    if (adminRole) {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: { roleId: adminRole.id },
      });
      console.log('管理员用户角色更新完成');
    }
  }

  // 5. 创建一些示例任务
  const sampleJobs = [
    {
      name: 'cleanup-audit-logs',
      data: { days: 90 },
      priority: -2,
      status: 'WAITING',
    },
    {
      name: 'generate-report',
      data: { reportType: 'monthly-stats' },
      priority: 0,
      status: 'WAITING',
    },
  ];

  for (const job of sampleJobs) {
    await prisma.jobQueue.create({
      data: job,
    });
  }

  console.log('示例任务创建完成');

  console.log('企业级数据种子完成！');
}

seedEnterpriseData()
  .catch((e) => {
    console.error('种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
