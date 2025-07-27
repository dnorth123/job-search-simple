import type { JobApplication } from '../jobTypes';

const STORAGE_KEY = 'jobApplications';

export function getJobApplications(): JobApplication[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveJobApplications(apps: JobApplication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
}

export function addJobApplication(app: JobApplication): void {
  const apps = getJobApplications();
  apps.push(app);
  saveJobApplications(apps);
}

export function updateJobApplication(updated: JobApplication): void {
  const apps = getJobApplications().map(app => app.id === updated.id ? updated : app);
  saveJobApplications(apps);
}

export function deleteJobApplication(id: string): void {
  const apps = getJobApplications().filter(app => app.id !== id);
  saveJobApplications(apps);
} 