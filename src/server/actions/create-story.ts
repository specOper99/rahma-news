"use server";

import { redirect } from "next/navigation";
import { createArticleAction } from "@/server/actions/editorial";

export async function createArticleAndRedirect() {
  const res = await createArticleAction();
  if (!res.ok) redirect("/admin/articles?err=create");
  redirect(`/admin/articles/${res.id}?locale=en`);
}
