'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { 
  Search, 
  Mail,
  Phone,
  Building2,
  Users,
  GraduationCap
} from 'lucide-react';
import advisorsData from '@/app/db/data/manoa_advisors.json';

interface Advisor {
  name: string;
  email: string | null;
  phone: string | null;
}

interface AdvisorsData {
  [department: string]: Advisor[];
}

const typedAdvisorsData = advisorsData as AdvisorsData;

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const allAdvisors = useMemo(() => {
    const advisorsList: Array<{ department: string; advisor: Advisor }> = [];
    
    Object.entries(typedAdvisorsData).forEach(([department, advisors]) => {
      advisors.forEach((advisor) => {
        advisorsList.push({ department, advisor });
      });
    });
    
    return advisorsList;
  }, []);

  const filteredAdvisors = useMemo(() => {
    if (!searchQuery.trim()) {
      return allAdvisors;
    }

    const query = searchQuery.toLowerCase();
    return allAdvisors.filter(({ department, advisor }) => {
      return (
        department.toLowerCase().includes(query) ||
        advisor.name.toLowerCase().includes(query) ||
        advisor.email?.toLowerCase().includes(query)
      );
    });
  }, [allAdvisors, searchQuery]);

  const groupedAdvisors = useMemo(() => {
    const grouped: { [key: string]: Advisor[] } = {};
    
    filteredAdvisors.forEach(({ department, advisor }) => {
      if (!grouped[department]) {
        grouped[department] = [];
      }
      grouped[department].push(advisor);
    });
    
    return grouped;
  }, [filteredAdvisors]);

  const departmentCount = Object.keys(groupedAdvisors).length;
  const advisorCount = filteredAdvisors.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <div className="text-center space-y-4 pb-6 border-b">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Academic Advisors</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Connect with dedicated advisors at UH Mānoa who are here to guide you through your academic journey.
          </p>
          
          <div className="flex items-center justify-center gap-8 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{advisorCount}</div>
              <div className="text-sm text-muted-foreground">Advisors</div>
            </div>
            <div className="h-12 w-px bg-border"></div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{departmentCount}</div>
              <div className="text-sm text-muted-foreground">Departments</div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, department, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(groupedAdvisors).length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  No advisors found matching your search.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your search terms.
                </p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(groupedAdvisors)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([department, advisors]) => (
                <div key={department} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2">
                    <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <h2 className="text-2xl font-semibold text-foreground">{department}</h2>
                    <Badge variant="secondary" className="ml-auto">
                      {advisors.length} {advisors.length === 1 ? 'Advisor' : 'Advisors'}
                    </Badge>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {advisors.map((advisor, index) => (
                      <Card 
                        key={`${department}-${index}`} 
                        className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 bg-card/50 backdrop-blur"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-start gap-2">
                            <div className="flex-1">
                              <div className="font-semibold text-foreground leading-snug">
                                {advisor.name}
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {advisor.email && (
                            <a
                              href={`mailto:${advisor.email}`}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                            >
                              <Mail className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate">{advisor.email}</span>
                            </a>
                          )}

                          {advisor.phone && (
                            <a
                              href={`tel:${advisor.phone}`}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                            >
                              <Phone className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                              <span>{advisor.phone}</span>
                            </a>
                          )}

                          {!advisor.email && !advisor.phone && (
                            <p className="text-sm text-muted-foreground italic">
                              Contact through department office
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>

        <Card className="bg-primary/5 border-primary/20 mt-12">
          <CardContent className="py-8">
            <div className="text-center space-y-3">
              <h3 className="text-xl font-semibold">Need Help Finding the Right Advisor?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                If you&apos;re unsure which advisor to contact, reach out to the Mānoa Advising Center (MAC) 
                at <a href="mailto:macadv@hawaii.edu" className="text-primary hover:underline font-medium">macadv@hawaii.edu</a> or 
                call <a href="tel:808-956-7273" className="text-primary hover:underline font-medium">(808) 956-7273</a>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
