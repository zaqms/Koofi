import {
  HalfwayInviteSession,
  halfwayInviteDynamic,
  halfwayInviteFromSearch,
  halfwayInviteMetadata,
} from "@/components/halfway-invite-session";

export const dynamic = halfwayInviteDynamic;

type HalfwayInvitePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
};

export async function generateMetadata({ params }: HalfwayInvitePageProps) {
  const { id } = await params;
  return halfwayInviteMetadata({ language: "en", id });
}

export default async function EnglishHalfwayInvitePage({
  params,
  searchParams,
}: HalfwayInvitePageProps) {
  const { id } = await params;
  const from = halfwayInviteFromSearch((await searchParams).from);
  return <HalfwayInviteSession language="en" id={id} from={from} />;
}
