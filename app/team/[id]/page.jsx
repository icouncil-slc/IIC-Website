import { notFound } from 'next/navigation';
import TeamMemberClientPage from '@/components/TeamMemberClientPage';

async function getDepartmentData(slug) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/team/${slug}`, {
      next: { revalidate: 3600 }, // Re-fetch data every hour
    });
    if (!res.ok) {
      return null;
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch department data:", error);
    return null;
  }
}

export async function generateMetadata({ params }) {
    const data = await getDepartmentData(params.id);
    if (!data) {
        return { title: 'Team Not Found' };
    }
    return {
        title: `${data.head.role} | IIC Team`,
        description: `Meet the ${data.head.role}, ${data.head.name}, and the members of the department.`,
    };
}

export default async function TeamPage({ params }) {
  const data = await getDepartmentData(params.id);

  if (!data) {
    notFound();
  }

  return <TeamMemberClientPage departmentData={data} />;
}
