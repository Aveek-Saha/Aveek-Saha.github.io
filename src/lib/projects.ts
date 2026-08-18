import matter from 'gray-matter';

export interface Project {
  id: string;
  slug: string;
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
    github?: string;
    website?: string;
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
        slug: String(data.title)
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        data: { ...data, date: new Date(data.date) },
      } as Project;
    })
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function projectPath(project: Project) {
  return `/projects/${project.slug}/`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function projectDescription(project: Project) {
  let description = project.data.description ?? '';

  for (const url of [project.data.github, project.data.website].filter((value): value is string => Boolean(value))) {
    description = description.replace(
      new RegExp(`<a\\s+[^>]*href=["']${escapeRegExp(url)}["'][^>]*>.*?<\\/a>`, 'gi'),
      '',
    );
  }

  return description
    .replace(/(?:Check it out here-?|Check it out on GitHub|Check it out at|Get the code on|Get the code:|Or on GitHub|or read the source code|Or have a look at the|Or fork it on GitHub|Add it to your Discord server here-|Read the)\s*/gi, '')
    .replace(/(<br\s*\/?>)\s*Or\s+learn/gi, '$1Learn')
    .replace(/(<br\s*\/?>)\s*Or\s+/gi, '$1')
    .replace(/(<br\s*\/?>)\s*[!.]+\s*(?=<br\s*\/?>|<div|$)/gi, '$1')
    .replace(/(?:<br\s*\/?>\s*){2,}/gi, '<br>')
    .replace(/<br\s*\/?>\s*(?=<div|$)/gi, '')
    .replace(/\s+([!.])/g, '$1')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
