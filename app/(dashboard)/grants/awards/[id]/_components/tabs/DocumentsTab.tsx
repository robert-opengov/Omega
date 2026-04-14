'use client';

import { FileText, Upload } from 'lucide-react';
import { Badge, Avatar, Button } from '@/components/ui/atoms';
import { SectionHeader } from '@/components/ui/molecules';
import type { GrantDocument, PaginatedResult } from '@/lib/core/ports/grants.repository';

interface DocumentsTabProps {
  documents: PaginatedResult<GrantDocument>;
}

export function DocumentsTab({ documents }: DocumentsTabProps) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Documents"
        description={`${documents.total} documents`}
        action={<Button variant="primary" size="sm" icon={Upload}>Upload</Button>}
      />

      <div className="overflow-x-auto rounded border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left text-xs font-semibold text-muted-foreground">
              <th scope="col" className="px-4 py-3">File Name</th>
              <th scope="col" className="px-4 py-3">Type</th>
              <th scope="col" className="px-4 py-3">Upload Date</th>
              <th scope="col" className="px-4 py-3">Uploaded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {documents.data.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <a href={doc.fileUrl} className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors">
                    <FileText className="h-4 w-4" />
                    {doc.fileName}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="default" size="sm" shape="pill">{doc.type}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{doc.uploadDate}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar src={doc.uploadedBy.avatar} fallback={doc.uploadedBy.name.charAt(0)} size="sm" />
                    <span className="text-foreground">{doc.uploadedBy.name}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
