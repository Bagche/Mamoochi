export const readDashboard = defineAbility((user: any) => {
  return user?.permissions?.includes("dashboard.read") ?? false;
});

export const editPage = defineAbility((user: any) => {
  return user?.permissions?.includes("page.edit") ?? false;
});

export const sendComment = defineAbility((user: any) => {
  return user?.permissions?.includes("comment.create") ?? false;
});
