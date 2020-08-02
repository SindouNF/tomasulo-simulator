// guardara as configuracoes que serao passadas para o programa
// configuracoes possiveis: num de ciclos de determinado tipo de instrucao
// (ld || sd || multd || divd || addd || subd || add || daddui || beq || bnez) + cycles
let config = {};


class Instruction {
    constructor(inst) {
        // inst = OPCODE RESTO
        inst = inst.split(" ");
        this.opcode = inst[0];
        this.rest = inst[1];
        switch(this.opcode) {
            case "SD":
                this.type = "S";
                break;
            case "LD": 
                this.type = "L";
                break;
            case "MULTD":
            case "DIVD":
            case "ADDD":
            case "SUBD":
                this.type = "F";
                break;
            case "ADD":
            case "DADDUI":
                this.type = "R";
                break;
            case "BEQ":
            case "BNEZ":
                this.type = "B";
                break;
        }
        this.cycles = config[opcode + "cycles"];
    }
}

class ReservationStation {
    constructor() {
        this.busy = false;
        this.op_code = null;
        this.vj = null;
        this.vk = null;
        this.qj = null;
        this.qk = null;
    }
}

// Qi - the reservation station whose result should be stored in this register (if blank or 0, no values are destined for this register)
class RegisterStatus {
    constructor() {
        this.registers = [];
        this.registers_fp = [];
        this.initialize();
    }

    initialize() {
        for (let i = 0; i < 8; i++) {
            this.registers[i] = new Register("R" + i);
            this.registers_fp[i] = new Register("F" + (i * 2))
        }
    }
}

// classe para representar um registrador
// guarda um nome de registrador (Ri, i = [0 - 7]) e (F(i * 2), i = 0 - 7)
// e a station que está utilizando ele 
class Register {
    // talvez inutil, mas whatever
    constructor(name) {
        this.name = name;
        this.station = null;
    }
}

// TODO: não sei se seria melhor abordagem, nem se ExeUnit faz sentido neste caso
// mas seria a classe que segura todas as reservation stations
class ExeUnit {
    constructor() {
        this.integer_unit = []; // 3
        this.float_add_sub_unit = []; // 3
        this.float_mult_div_unit = []; // 2
        this.store_unit = []; // 3
        this.load_unit = []; // 6

        this.initialize();
    }
    initialize() {
        for (let i = 0; i < 3; i++) {
            // inicializando unidade de inteiro
            this.integer_unit.push(new ReservationStation()); 
            // inicializando unidade de ponto flutuante - addsub
            this.float_add_sub_unit.push(new ReservationStation());
            // inicializando unidade de store
            this.store_unit.push(new ReservationStation());
            // inicializando unidade de load
            this.load_unit.push(new ReservationStation());
            this.load_unit.push(new ReservationStation());
        }
        for (let i = 0; i < 2; i++) {
            // inicializando unidade de ponto flutuante - multdiv
            this.float_mult_div_unit.push(new ReservationStation()); 
        }
    }
}

// a classe que junta tudo
class Tomasulo {
    constructor() {
        this.execution_unit = new ExeUnit(); 
    }
    
    issue() {};
    execute() {};
    write() {};
}

// pega instruction da entrada, joga para a reservation station e executa