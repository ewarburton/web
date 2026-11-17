/* Named Engine-Glider machines.
   N-1..N-11 are the Current Axolotls (shown as N-AX-1..N-AX-11); N-12 is
   Deever, named by the CET community (shown as N-CET-12).

   `pair` is the identity; `eg` is the machine's LINE in the survivors file that
   the round passes are numbered by. It is not an id in the shipped list: these
   are removed from it, so they have no EG id at all, and the number is only the
   shift to apply to *other* rows. A non-named survivor at line L is
   EG-(L - named lines before L); e.g. Comet sits at line 582,176, so the row at
   line 582,177 is EG-582,169. Deever has `eg: null` because it is absent from
   that file. Clicking a name loads the pair directly, so the links do not depend
   on any id. R/L2 are model-derived: the round law was fitted on L0..L0+5 and
   extrapolated, and R depends on the boot convention -- see LADDER.md.

   `color` is the name's own hue. The ramp runs down the records table in rank
   order (grey for Deever, then pink -> magenta -> violet -> blue -> green ->
   yellow -> salmon down to Prima), so a name's colour also says roughly where
   it sits. */
window.CET4_EG_NAMED = [{"n":1,"alias":"Prima","pair":"0LB1LB_1LC1RB_0RD0LC_1RA0LD|1LB1LC_1RC0RA_1RA0RD_1RB0LA","R":16,"L2":26,"L0":11,"eg":84434,"color":"#ffc8bb"},{"n":2,"alias":"Firstal","pair":"1LB0LD_0LC0RC_1LD1RC_1RA0LD|0RB0RD_0LC0RA_0LD1RA_1RB1LD","R":17,"L2":23832,"L0":11,"eg":283472,"color":"#ffdcbb"},{"n":3,"alias":"Dancer","pair":"0LB0RB_1LC1RB_1RD0LC_1LA0LC|0RB1RC_1LC0LB_0LD0RC_1RA1LD","R":18,"L2":21,"L0":11,"eg":150444,"color":"#fff0bb"},{"n":4,"alias":"Cupid","pair":"1LB1RA_1RC0LB_1LD1RD_1RA0RC|0RB1LC_0RC0LC_1RD0LA_1LA1RB","R":19,"L2":27,"L0":8,"eg":1047545,"color":"#eeffbb"},{"n":5,"alias":"Celestal","pair":"0LB1RB_1LC1RB_1RD0LC_1LD0RA|1LB0RB_1RC0LC_1RD1LD_1RA1RB","R":20,"L2":146,"L0":11,"eg":101128,"color":"#bbffbb"},{"n":6,"alias":"Rudolph","pair":"0LB1LB_1LC1RB_1RA0LD_0RC0LD|1RB1RD_0RC0LA_1LA1RA_0LD1LB","R":21,"L2":23821,"L0":11,"eg":74658,"color":"#bbffee"},{"n":7,"alias":"Trimestrius","pair":"0LB0LC_1RA1RC_0RD0LC_1LA1RD|0RB1LD_1RC0RC_1LC0RA_1RA0LD","R":22,"L2":145,"L0":11,"eg":275384,"color":"#bbeeff"},{"n":8,"alias":"Quadrestrius","pair":"0LB0RD_1LC1RB_1RD0LC_1LA1RB|1LB0RC_1RA0RD_1LA1RB_1LD1LC","R":24,"L2":16,"L0":12,"eg":145483,"color":"#bbccff"},{"n":9,"alias":"Dasher","pair":"1LB0LC_1LC1RB_1RA0LD_0RC0LD|0RB0LB_1RC0LD_1LD1RA_0RA1LB","R":25,"L2":8,"L0":8,"eg":779330,"color":"#ccbbff"},{"n":10,"alias":"Vixen","pair":"1LB1RA_1RC0LB_0LD1RD_1RA0RD|0RB1LC_1RD0RD_1RA0LC_1LD0RA","R":25,"L2":122,"L0":11,"eg":1047402,"color":"#ffbbff"},{"n":11,"alias":"Comet","pair":"1LB1RA_0RC0LB_1RD1LC_1RA1LD|1RB0RB_1LB0RC_0RA1LD_1RC0LD","R":25,"L2":1012,"L0":11,"eg":582176,"color":"#ffbbdd"},
{"n":12,"alias":"Deever","pair":"0LD0LA_1LC1RB_0RB0LC_1RD0LB|1RB0RD_0RC0LA_1LB1RC_1LC0LC","R":140,"L2":null,"L0":null,"eg":null,"community":true,"color":"#bbbbbb"}];
