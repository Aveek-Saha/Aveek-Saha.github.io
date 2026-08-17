import matter from 'gray-matter';

export interface Project {
  id: string;
  data: {
    layout?: string;
    'modal-id': number;
    date: Date;
    img: string;
    title: string;
    alt?: string;
    'project-date': string;
    category: string;
    description?: string;
    client?: string;
  };
}

export async function getProjects() {
  const files = import.meta.glob('../../_posts/*.markdown', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  return Object.entries(files)
    .map(([path, source]) => {
      const { data } = matter(source);
      return {
        id: path.split('/').pop() ?? path,
        data: { ...data, date: new Date(data.date) },
      } as Project;
    })
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}
