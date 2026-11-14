use strict;
use warnings;
use IO::Socket::INET;
use IO::Select;
use File::Spec;
my ($vault,$target,$identity_file)=@ARGV;
# Identidade escolhida no app nativo; o servidor não aceita pareamento pela rede.
use JSON::PP qw(encode_json);
my $ports=IO::Select->new;
my %roots;
for my $pair ([$vault,8173],[$target,8174]) {
    my ($dir,$port)=@$pair;
    my $sock=IO::Socket::INET->new(LocalAddr=>'127.0.0.1',LocalPort=>$port,Listen=>8,ReuseAddr=>1) or die "Porta $port ocupada\n";
    $ports->add($sock);
    $roots{$port}=$dir;
}
$|=1;
print "READY\n";
my $parent = getppid();
while (!defined($identity_file) || getppid() == $parent) {
    for my $sock ($ports->can_read(1)) {
        my $client=$sock->accept or next;
        my $port=$sock->sockport;
        eval {
            local $SIG{ALRM}=sub{die "timeout"};
            local $SIG{PIPE}='IGNORE';
            alarm 3;
            my $headers='';
            while (length($headers)<8192 && index($headers,"\r\n\r\n")<0) {
                my $chunk; last unless sysread($client,$chunk,1024); $headers.=$chunk;
            }
            my ($name)=$headers =~ m{\AGET /([A-Za-z0-9.-]*)(?:\?[^\s]*)? HTTP/1\.[01]\r\n};
            my ($code,$body,$mime)=('404 Not Found','','text/plain');
            if (defined $name && $headers =~ /^Host: localhost:$port\r$/mi) {
                $name='index.html' if $name eq '';
                if ($name =~ /^[a-zA-Z0-9-]+\.(?:html|js)$/ && open(my $fh,'<:raw',File::Spec->catfile($roots{$port},$name))) {
                    local $/; $body=<$fh>; if ($port == 8173 && $name eq 'approval-config.js' && defined $identity_file &&
                        open(my $identity, '<', $identity_file)) {
                        my $origin = <$identity> // '';
                        close $identity;
                        if ($origin =~ m{\Asafari-web-extension://[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\z}) {
                            $body='globalThis.approvalConfig = '.encode_json({
                                extension=>$origin,vault=>'http://localhost:8173',target=>'http://localhost:8174'
                            }).';';
                        }
                    }
                    $code='200 OK'; $mime= $name =~ /\.js$/ ? 'application/javascript' : 'text/html; charset=utf-8';
                }
            }
            print $client "HTTP/1.1 $code\r\nContent-Type: $mime\r\nContent-Length: ".length($body)."\r\nCache-Control: no-store\r\nX-Frame-Options: DENY\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n$body";
        };
        alarm 0; close $client;
    }
}
