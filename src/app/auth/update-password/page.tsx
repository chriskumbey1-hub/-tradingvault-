import { redirect } from "next/navigation";

export default function OldUpdatePasswordPage() {
  redirect("/reset-password");
}
