interface Task {
  id: string;
  title: string;
  estTimeMin: number;
  urgency: 'low' | 'med' | 'high';
  status: 'pending' | 'done' | 'bumped';
}

interface Props {
  originalTasks: Task[];
  updatedTasks: Task[];
}

export default function TaskListDiff({ originalTasks, updatedTasks }: Props) {
  return (
    <div className="mt-8">
      <p className="font-mono-label text-[11px] tracking-widest uppercase text-[#6B6E7A] mb-3">
        Docket — Amended
      </p>
      <div className="border border-[#2A2D38]">
        {updatedTasks.map((task) => {
          const original = originalTasks.find((t) => t.id === task.id);
          const changed = original && original.title !== task.title;
          const bumped = task.status === 'bumped';

          return (
            <div
              key={task.id}
              className={`flex items-center justify-between px-5 py-3 border-b border-[#2A2D38] last:border-b-0
                ${bumped ? 'bg-[#1D1F26] opacity-50' : changed ? 'bg-[#26241A]' : 'bg-[#1D1F26]'}`}
            >
              <span
                className={`text-sm text-[#F5F3EE] ${bumped ? 'line-through decoration-[#6B6E7A]' : ''}`}
              >
                {task.title}
                {bumped && (
                  <span className="font-mono-label text-[10px] tracking-widest text-[#6B6E7A] ml-2 uppercase">
                    (bumped)
                  </span>
                )}
              </span>
              <span className="font-mono-label text-[10px] tracking-widest text-[#6B6E7A] uppercase">
                {task.urgency} · {task.estTimeMin}m
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}