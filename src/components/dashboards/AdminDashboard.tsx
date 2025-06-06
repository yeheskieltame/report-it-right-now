
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Users, FileText, Scale } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [newValidatorAddress, setNewValidatorAddress] = useState('');
  const [newReporterAddress, setNewReporterAddress] = useState('');
  const [validators, setValidators] = useState<any[]>([]);
  const [reporters, setReporters] = useState<any[]>([]);
  const [validatedReports, setValidatedReports] = useState<any[]>([]);
  const [appealReports, setAppealReports] = useState<any[]>([]);

  const handleAddValidator = () => {
    console.log('Adding validator:', newValidatorAddress);
    setNewValidatorAddress('');
  };

  const handleAddReporter = () => {
    console.log('Adding reporter:', newReporterAddress);
    setNewReporterAddress('');
  };

  const handleSetContribution = (reportId: string, level: number) => {
    console.log('Setting contribution level:', reportId, level);
  };

  const handleAppealDecision = (reportId: string, userWins: boolean) => {
    console.log('Appeal decision:', reportId, userWins);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="w-8 h-8 text-blue-600" />
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Institution Admin Dashboard
        </h2>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="reports">Review Reports</TabsTrigger>
          <TabsTrigger value="appeals">Appeals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Institution Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-blue-600">Polda Metro Jaya</p>
                <p className="text-sm text-muted-foreground">Institution ID: INST001</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Active Validators</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">{validators.length}</p>
                <p className="text-sm text-muted-foreground">Registered validators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Registered Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-orange-600">{reporters.length}</p>
                <p className="text-sm text-muted-foreground">Active reporters</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Validator List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {validators.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No validators registered</p>
                ) : (
                  validators.map((validator, index) => (
                    <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{validator.address}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">Reputation: {validator.reputation}</Badge>
                        <Badge className={validator.isActive ? 'bg-green-500' : 'bg-gray-500'}>
                          {validator.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Add New Validator</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="validator-address">Validator Address</Label>
                  <Input
                    id="validator-address"
                    placeholder="0x..."
                    value={newValidatorAddress}
                    onChange={(e) => setNewValidatorAddress(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddValidator}
                  className="w-full bg-gradient-to-r from-blue-500 to-green-500"
                >
                  Add Validator
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Add New Reporter</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reporter-address">Reporter Address</Label>
                  <Input
                    id="reporter-address"
                    placeholder="0x..."
                    value={newReporterAddress}
                    onChange={(e) => setNewReporterAddress(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleAddReporter}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500"
                >
                  Add Reporter
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Validated Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {validatedReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No validated reports</p>
                ) : (
                  validatedReports.map((report, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                        </div>
                        <Badge className={report.status === 'Valid' ? 'bg-green-500' : 'bg-red-500'}>
                          {report.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{report.description}</p>
                      <div className="flex items-center space-x-4">
                        <Input 
                          type="number" 
                          placeholder="Level (1-5)" 
                          min="1" 
                          max="5" 
                          className="w-32"
                        />
                        <Button 
                          onClick={() => handleSetContribution(report.id, 3)}
                          size="sm"
                        >
                          Set Contribution
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appeals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="w-5 h-5" />
                <span>Appeal Decisions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {appealReports.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No appeals to review</p>
                ) : (
                  appealReports.map((report, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">{report.title}</h4>
                          <p className="text-sm text-muted-foreground">ID: {report.id}</p>
                        </div>
                        <Badge className="bg-yellow-500">Appeal</Badge>
                      </div>
                      <p className="text-sm">{report.description}</p>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleAppealDecision(report.id, true)}
                          className="bg-green-500 hover:bg-green-600"
                          size="sm"
                        >
                          User Wins
                        </Button>
                        <Button 
                          onClick={() => handleAppealDecision(report.id, false)}
                          className="bg-red-500 hover:bg-red-600"
                          size="sm"
                        >
                          User Loses
                        </Button>
                      </div>
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

export default AdminDashboard;
