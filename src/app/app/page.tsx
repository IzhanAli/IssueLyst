import { redirect } from "next/navigation";

export default function AppIndex() {
  redirect("/app/project/engineering/list");
}
