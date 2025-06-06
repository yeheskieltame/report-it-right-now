
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Plus, History } from 'lucide-react';

const ReporterDashboard: React.FC = () => {
  const [reportForm, setReportForm] = useState({
    institusiId: '',
    judul: '',
    deskripsi: ''
  });
  const [myReports, setMyReports] = useState<any[]>([]);
  const [institutions, setInstitutions] = useState([
    { id: 'INST001', name: 'Polda Metro Jaya' },
    { id: 'INST002', name: 'Kejaksaan Negeri Jakarta Pusat' },
    { id: 'INST003', name: 'Dinas Lingkungan Hidup DKI' }
  ]);

  const handleSubmitReport = () => {
    console.log('Submitting report:', reportForm);
    // Reset form
    setReportForm({
      institusiId: '',
      judul: '',
      deskripsi: ''
    });
  };

  const handleAppeal = (reportId: string) => {
    console.log('Submitting appeal for report:', reportId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Menunggu':
        return <Badge className="bg-yellow-500">Menunggu</Badge>;
      case 'Valid':
        return <Badge className="bg-green-500">Valid</Badge>;
      case 'Tidak Valid':
        return <Badge className="bg-red-500">Tidak Valid</Badge>;
      case 'Banding':
        return <Badge className="bg-purple-500">Banding</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <FileText className="w-8 h-8 text-orange-600" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          Reporter Dashboard
        </h2>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Report</TabsTrigger>
          <TabsTrigger value="reports">My Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Submit New Report</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="institution">Select Institution</Label>
                <Select 
                  value={reportForm.institusiId} 
                  onValueChange={(value) => setReportForm({...reportForm, institusiId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="Enter report title"
                  value={reportForm.judul}
                  onChange={(e) => setReportForm({...reportForm, judul: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Report Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the incident or issue in detail..."
                  rows={6}
                  value={reportForm.deskripsi}
                  onChange={(e) => setReportForm({...reportForm, deskripsi: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleSubmitReport}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                disabled={!reportForm.institusiId || !reportForm.judul || !reportForm.deskripsi}
              >
                Submit Report
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>My Report History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myReports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No reports submitted yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Your reports will appear here after submission</p>
                  </div>
                ) : (
                  myReports.map((report, index) => (
                    <div key={index} className="border rounded-lg p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-lg">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">Report ID: {report.id}</p>
                          <p className="text-sm text-muted-foreground">Submitted to: {report.institution}</p>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(report.status)}
                          <p className="text-xs text-muted-foreground">{report.submittedAt}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm">{report.description}</p>
                      </div>

                      {report.validationResult && (
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <p className="text-sm font-semibold text-blue-800">Validation Result:</p>
                          <p className="text-sm text-blue-700">{report.validationResult}</p>
                        </div>
                      )}

                      {report.status === 'Tidak Valid' && (
                        <div className="pt-2">
                          <Button 
                            onClick={() => handleAppeal(report.id)}
                            className="bg-purple-500 hover:bg-purple-600"
                            size="sm"
                          >
                            Submit Appeal
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            Appeal requires staking tokens. You will get them back if appeal is successful.
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReporterDashboard;
