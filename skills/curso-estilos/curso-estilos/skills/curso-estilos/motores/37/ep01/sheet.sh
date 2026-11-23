# sheet.sh prefix out.jpg cols t1 t2 ... -> grid of 216px-wide stills with labels
pre=$1; out=$2; cols=$3; shift 3; ins=""; fl=""; i=0
for t in "$@"; do ins="$ins -i qa/${pre}_$t.png"; fl="$fl[$i]scale=216:-1,drawtext=text='$t':x=6:y=6:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.5[v$i];"; i=$((i+1)); done
n=$i; lay=""; for j in $(seq 0 $((n-1))); do c=$((j % cols)); r=$((j / cols)); lay="$lay${lay:+|}$((c*216))_$((r*384))"; done
st=""; for j in $(seq 0 $((n-1))); do st="$st[v$j]"; done
ffmpeg -y -loglevel error $ins -filter_complex "${fl}${st}xstack=inputs=$n:layout=$lay:fill=black" -q:v 3 $out
