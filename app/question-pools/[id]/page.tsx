import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getServerSession } from "@/lib/session";
// Import the new client page component
import QuestionPoolClientPage from "./question-pool-client-page";
import { ExtendedPoolQuestion } from "./components/question-list"; // Import ExtendedPoolQuestion
import { QuestionPool } from "@prisma/client"; // Import QuestionPool type
import { JsonValue } from "@prisma/client/runtime/library"; // Import JsonValue type


interface PageProps { // Renamed interface to avoid conflict if needed
  params: {
    id: string;
  };
}

// This is now the main server component for the route
export default async function Page({ params }: PageProps) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/auth/login");
  }

  let questionPool: (QuestionPool & { questions: ExtendedPoolQuestion[] }) | null = null;

  try {
    // params.id'nin sayı olduğundan emin olalım
    const poolId = parseInt(params.id);

    if (isNaN(poolId)) {
      console.error(`Invalid question pool ID: ${params.id}`);
      redirect("/question-pools"); // Geçersiz ID durumunda yönlendir
    }

    const fetchedPool = await db.questionPool.findUnique({
      where: {
        id: poolId,
        userId: session.user.id, // Kullanıcı kontrolünü ekle
      },
      include: {
        questions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!fetchedPool) {
      // Consider redirecting or showing a not found message
      // For now, we'll pass null which the client component handles
      console.warn(`Question pool with ID ${params.id} not found. Redirecting.`);
      redirect("/question-pools"); // Redirect if not found
    } else {
      // Transform the options data to match the ExtendedPoolQuestion type
      questionPool = {
        ...fetchedPool,
        questions: fetchedPool.questions.map(q => ({
          ...q,
          options: Array.isArray(q.options)
            ? q.options.map(option => {
                // Check if option is an object and has text and label properties
                if (option && typeof option === 'object' && 'text' in option && 'label' in option) {
                  return {
                    text: (option.text as string) || '',
                    label: (option.label as string) || '',
                  };
                }
                // Return a default structure if option is not valid
                return { text: '', label: '' };
              })
            : [],
        })),
      };
    }

  } catch (error) {
    console.error("Error fetching or transforming question pool data:", error);
    // Optionally redirect to an error page or return null
    // redirect("/error");
    // Return null to indicate data loading failed, client component should handle this
    questionPool = null;
  }

  // Pass the transformed data to the Client Component
  // Render the client component with the fetched data
  return <QuestionPoolClientPage initialQuestionPoolData={questionPool} />;
}
